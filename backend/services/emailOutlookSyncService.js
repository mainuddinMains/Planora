const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
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
    title = 'Assignment';
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
  const password = source.password_encrypted ? source.password_encrypted.toString('utf8') : null;
  if (!password) {
    console.log(`No password for source ${source.id}, skipping`);
    return;
  }

  console.log(`[EmailSync] Connecting to ${source.host} as ${source.username}...`);
  console.log(`[EmailSync] Password length: ${password ? password.length : 0}`);
  
  let client;
  try {
    client = new ImapFlow({
      host: source.host,
      port: source.port,
      secure: !!source.tls,
      auth: {
        user: source.username,
        pass: password
      },
      logger: console
    });

    console.log(`[EmailSync] Attempting to connect...`);
    await client.connect();
    console.log(`[EmailSync] Connected successfully!`);

    const mailbox = await client.openBox('INBOX');
    console.log(`[EmailSync] Opened INBOX`);
    
    // Search for messages from last 30 days
    const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const searchCriteria = ['SINCE', sinceDate.toISOString().split('T')[0]];
    console.log(`[EmailSync] Searching with criteria:`, searchCriteria);
    
    const messages = await client.search(searchCriteria, { envelope: true });
    console.log(`[EmailSync] Found ${messages.length} messages`);
    
    let tasksCreated = 0;

    // Process ALL recent messages - import everything first
    for (const msg of messages.slice(-30)) {
      try {
        // Fetch the full message
        const msgData = await client.fetch(msg.uid, { envelope: true, source: true });
        const msgEnvelope = Array.isArray(msgData) ? msgData[0] : msgData;
        
        if (!msgEnvelope || !msgEnvelope.envelope) {
          continue;
        }
        
        const subject = msgEnvelope.envelope.subject || '(No Subject)';
        const from = msgEnvelope.envelope.from?.[0]?.address || 'Unknown';
        
        console.log(`[EmailSync] Processing: ${subject} from ${from}`);
        
        // Get the source for parsing
        const msgSource = await client.fetch(msg.uid, { source: true });
        const sourceData = Array.isArray(msgSource) ? msgSource[0] : msgSource;
        const parsed = await simpleParser(sourceData.source);
        
        const text = (parsed.text || '') + ' ' + (parsed.html || '');
        const combinedText = subject + ' ' + text;

        const data = parseAssignmentFromText(combinedText);
        
        // If no title found, use subject
        const finalTitle = data.title || subject;
        
        // Determine if it's an Assignment, Announcement, or general email
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
      } catch (parseErr) {
        console.error('[EmailSync] Error:', parseErr.message);
      }
    }

    console.log(`[EmailSync] Total created: ${tasksCreated} tasks for user ${source.user_id}`);

  } catch (err) {
    console.error('[EmailSync] Error:', err.message);
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (e) {}
    }
  }
}

async function syncAllUsers() {
  const sources = await db.query('SELECT * FROM email_sources WHERE enabled = TRUE', []);
  
  console.log(`Starting email sync for ${sources.rows.length} sources`);
  
  for (const src of sources.rows) {
    await syncForSource(src);
    
    await db.query(
      'UPDATE email_sources SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
      [src.id]
    );
  }
  
  console.log('Email sync completed');
}

module.exports = { syncAllUsers, syncForSource };
