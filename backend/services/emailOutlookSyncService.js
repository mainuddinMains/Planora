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

  let client;
  try {
    client = new ImapFlow({
      host: source.host,
      port: source.port,
      secure: !!source.tls,
      auth: {
        user: source.username,
        pass: password
      }
    });

    await client.connect();

    const mailbox = await client.openBox('INBOX');
    
    const since = source.last_sync_at 
      ? new Date(source.last_sync_at) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const searchCriteria = ['SINCE', since.toISOString()];
    
    const messages = await client.search(searchCriteria, { envelope: true, source: true });
    
    console.log(`Found ${messages.length} new messages for user ${source.user_id}`);

    let tasksCreated = 0;

    for (const msg of messages.slice(-50)) {
      try {
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || '';
        const text = (parsed.text || '') + ' ' + (parsed.html || '');
        const combinedText = subject + ' ' + text;

        const data = parseAssignmentFromText(combinedText);

        if (!data.title || data.title === 'Assignment') {
          if (!subject.toLowerCase().includes('homework') && 
              !subject.toLowerCase().includes('assignment') &&
              !subject.toLowerCase().includes('due') &&
              !subject.toLowerCase().includes('quiz') &&
              !subject.toLowerCase().includes('exam') &&
              !subject.toLowerCase().includes('project')) {
            continue;
          }
        }

        const courseId = await findOrCreateCourse(source.user_id, data.courseCode);
        
        const taskResult = await db.query(
          `INSERT INTO tasks (user_id, course_id, title, due_date, priority)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [source.user_id, courseId, data.title, data.due, 'medium']
        );

        const taskId = taskResult.rows[0].id;
        const tagId = await findOrCreateTag(source.user_id, 'Assignment');
        
        await db.query(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [taskId, tagId]
        );

        tasksCreated++;
      } catch (parseErr) {
        console.error('Error parsing email:', parseErr.message);
      }
    }

    console.log(`Created ${tasksCreated} tasks for user ${source.user_id}`);

  } catch (err) {
    console.error('Email sync error for source', source.id, ':', err.message);
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
