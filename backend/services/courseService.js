const db = require('../db');


async function initializeCourseTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      color TEXT DEFAULT '#4a90a4',
      instructor TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(query);
    console.log('Courses table checked/created successfully.');
  } catch (err) {
    console.error('Error initializing courses table:', err);
  }
}

// Run initialization immediately when the service is loaded
initializeCourseTable();

async function createCourse(userId, courseData) {
  const { name, code, color, instructor } = courseData;
  
  const result = await db.query(
    `INSERT INTO courses (user_id, name, code, color, instructor)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, code || null, color || '#4a90a4', instructor || null]
  );
  
  return result.rows[0];
}

async function getCoursesByUser(userId) {
  const result = await db.query(
    'SELECT * FROM courses WHERE user_id = $1 ORDER BY name',
    [userId]
  );
  return result.rows;
}

async function getCourseById(courseId, userId) {
  const result = await db.query(
    'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
    [courseId, userId]
  );
  return result.rows[0] || null;
}

async function updateCourse(courseId, userId, updates) {
  const allowedFields = ['name', 'code', 'color', 'instructor'];
  const setClause = [];
  const params = [courseId, userId];
  let paramCount = 2;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      paramCount++;
      setClause.push(`${key} = $${paramCount}`);
      params.push(value);
    }
  }

  if (setClause.length === 0) {
    return getCourseById(courseId, userId);
  }

  // Adding an automatic update to updated_at timestamp
  setClause.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE courses
    SET ${setClause.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await db.query(query, params);
  return result.rows[0] || null;
}

async function deleteCourse(courseId, userId) {
  const result = await db.query(
    'DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING id',
    [courseId, userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createCourse,
  getCoursesByUser,
  getCourseById,
  updateCourse,
  deleteCourse
};