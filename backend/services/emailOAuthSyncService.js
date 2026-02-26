const microsoftOAuth = require('./microsoftOAuth');
const chrono = require('chrono-node');
const db = require('../db');

function parseAssignmentFromText(text) {
  const courseMatch = text.match(/([A-Z]{2,4}\s*\d{3,4})/);
  const courseCode = courseMatch ? courseMatch[1].replace(/\s+/g, ' ').trim() : null;

  let title = null;
  const dash = text.split('–');
  if (dash.length > 1) {
    title = dash[1].trim();
  }

  if (!title) {
    const m = text.match(/^\s*(.*?)\s*(?:Due|DOI|$)/i);
    title = m ? m[1].trim() : null;
  }

  if (!title) {
    title = 'Email';
  }

  const due = chrono.parseDate(text) || null;

  return { courseCode, title, due };
}

async function findOrCreateCourse(userId, courseName) {
  if (!courseName) {
    const result = await db.query(
      "SELECT id FROM courses WHERE user_id = $1 AND name = 'General'",
      [userId]
    );
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    const newCourse = await db.query(
      "INSERT INTO courses (user_id, name) VALUES ($1, 'General') RETURNING id",
      [userId]
    );
    return newCourse.rows[0].id;
  }

  const existing = await db.query(
    'SELECT id FROM courses WHERE user_id = $1 AND (name = $2 OR code = $2)',
    [userId, courseName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const newCourse = await db.query(
    'INSERT INTO courses (user_id, name) VALUES ($1, $2) RETURNING id',
    [userId, courseName]
  );

  return newCourse.rows[0].id;
}

async function findOrCreateTag(userId, tagName) {
  const existing = await db.query(
    'SELECT id FROM tags WHERE user_id = $1 AND name = $2',
    [userId, tagName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const newTag = await db.query(
    'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id',
    [userId, tagName]
  );

  return newTag.rows[0].id;
}

async function syncForSource(source) {
  console.log(`[EmailSync] Syncing for user with OAuth...`);
  
  let accessToken = source.access_token;
  
  // Check if token is expired and refresh if needed
  if (source.expires_at && new Date(source.expires_at) < new Date()) {
    console.log(`[EmailSync] Token expired, refreshing...`);
    try {
      const newTokenData = await microsoftOAuth.refreshAccessToken(source.refresh_token);
      accessToken = newTokenData.access_token;
      
      // Update the tokens in database
      await db.query(
        `UPDATE email_sources SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4`,
        [newTokenData.access_token, newTokenData.refresh_token, Date.now() + (newTokenData.expires_in * 1000), source.id]
      );
    } catch (err) {
      console.error(`[EmailSync] Token refresh failed:`, err.message);
      return;
    }
  }

  try {
    const emails = await microsoftOAuth.getRecentEmails(accessToken, 30);
    console.log(`[EmailSync] Found ${emails.length} emails`);

    let tasksCreated = 0;

    for (const email of emails) {
      try {
        const subject = email.subject || '(No Subject)';
        const from = email.from?.emailAddress?.address || 'Unknown';
        const body = email.bodyPreview || '';
        const combinedText = subject + ' ' + body;

        const data = parseAssignmentFromText(combinedText);
        const finalTitle = data.title || subject;

        let tagName = 'Email';
        const subjectLower = subject.toLowerCase();

        // Check for announcements
        if (subjectLower.includes('announcement') || 
            subjectLower.includes('notice') ||
            subjectLower.includes('update from') ||
            subjectLower.includes('reminder') ||
            subjectLower.includes('information')) {
          tagName = 'Announcement';
        }
        
        // Check for assignments
        if (subjectLower.includes('homework') || 
            subjectLower.includes('assignment') ||
            subjectLower.includes('due') ||
            subjectLower.includes('quiz') ||
            subjectLower.includes('exam') ||
            subjectLower.includes('project') ||
            subjectLower.includes('lab') ||
            subjectLower.includes('paper') ||
            subjectLower.includes('essay') ||
            subjectLower.includes('test')) {
          tagName = 'Assignment';
        }

        const courseId = await findOrCreateCourse(source.user_id, data.courseCode);
        
        const taskResult = await db.query(
          `INSERT INTO tasks (user_id, course_id, title, description, due_date, priority)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [source.user_id, courseId, finalTitle, `From: ${from}`, 
           data.due, 
           tagName === 'Assignment' ? 'high' : (tagName === 'Announcement' ? 'medium' : 'low')]
        );

        const taskId = taskResult.rows[0].id;
        const tagId = await findOrCreateTag(source.user_id, tagName);
        
        await db.query(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [taskId, tagId]
        );

        console.log(`[EmailSync] Created: ${finalTitle} (${tagName})`);
        tasksCreated++;
      } catch (err) {
        console.error(`[EmailSync] Error processing email:`, err.message);
      }
    }

    console.log(`[EmailSync] Created ${tasksCreated} tasks for user ${source.user_id}`);

  } catch (err) {
    console.error(`[EmailSync] Error fetching emails:`, err.response?.data || err.message);
  }
}

async function syncAllUsers() {
  const sources = await db.query('SELECT * FROM email_sources WHERE provider = $1 AND enabled = TRUE', ['microsoft_oauth']);
  
  console.log(`[EmailSync] Starting sync for ${sources.rows.length} OAuth sources`);
  
  for (const src of sources.rows) {
    await syncForSource(src);
  }
  
  console.log('[EmailSync] OAuth sync completed');
}

module.exports = { syncAllUsers, syncForSource };
