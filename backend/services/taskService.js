const db = require('../db');

async function initializeTaskTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      course_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      due_date TIMESTAMP,
      duration INTEGER DEFAULT 60,
      priority TEXT DEFAULT 'medium',
      is_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(query);

    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_data TEXT;`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;`);

    console.log('Tasks table and attachment columns checked/created successfully.');
  } catch (err) {
    console.error('Error initializing tasks table:', err);
  }
}

// Run initialization
initializeTaskTable();

async function createTask(userId, taskData) {
  const { course_id, title, description, due_date, duration, priority } = taskData;
  
  const result = await db.query(
    `INSERT INTO tasks (user_id, course_id, title, description, due_date, duration, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, course_id || null, title, description || null, due_date || null, duration || 60, priority || 'medium']
  );
  
  return result.rows[0];
}

async function getTasksByUser(userId, filters = {}) {
  let query = `
    SELECT t.*, c.name as course_name, c.color as course_color
    FROM tasks t
    LEFT JOIN courses c ON t.course_id = c.id
    WHERE t.user_id = $1
  `;
  const params = [userId];
  let paramCount = 1;

  if (filters.completed !== undefined) {
    paramCount++;
    query += ` AND t.is_completed = $${paramCount}`;
    params.push(filters.completed);
  }

  if (filters.priority) {
    paramCount++;
    query += ` AND t.priority = $${paramCount}`;
    params.push(filters.priority);
  }

  if (filters.course_id) {
    paramCount++;
    query += ` AND t.course_id = $${paramCount}`;
    params.push(filters.course_id);
  }

  if (filters.search) {
    paramCount++;
    query += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';

  const result = await db.query(query, params);
  return result.rows;
}

async function getTaskById(taskId, userId) {
  const result = await db.query(
    `SELECT t.*, c.name as course_name, c.color as course_color
     FROM tasks t
     LEFT JOIN courses c ON t.course_id = c.id
     WHERE t.id = $1 AND t.user_id = $2`,
    [taskId, userId]
  );
  
  return result.rows[0] || null;
}

async function updateTask(taskId, userId, updates) {
  const allowedFields = ['title', 'description', 'course_id', 'due_date', 'duration', 'priority', 'is_completed'];
  const setClause = [];
  const params = [taskId, userId];
  let paramCount = 2;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      setClause.push(`${key} = $${paramCount}`);
      params.push(value);
    }
  }

  if (setClause.length === 0) {
    return getTaskById(taskId, userId);
  }

  setClause.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE tasks
    SET ${setClause.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(query, params);
  return result.rows[0] || null;
}

async function deleteTask(taskId, userId) {
  const result = await db.query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
    [taskId, userId]
  );
  
  return result.rows[0] || null;
}

module.exports = {
  createTask,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask
};