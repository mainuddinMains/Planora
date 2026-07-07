const db = require('../db');


async function initializeNotificationTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      task_id INTEGER,
      type TEXT DEFAULT 'reminder',
      title TEXT NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await db.query(query);
    console.log('Notifications table checked/created successfully.');
  } catch (err) {
    console.error('Error initializing notifications table:', err);
  }
}

// Run initialization
initializeNotificationTable();

async function createNotification(userId, notificationData) {
  const { task_id, type, title, message } = notificationData;

  const result = await db.query(
    `INSERT INTO notifications (user_id, task_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, task_id || null, type || 'reminder', title, message || null]
  );

  return result.rows[0];
}

async function getNotificationsByUser(userId, filters = {}) {
  let query = 'SELECT * FROM notifications WHERE user_id = $1';
  const params = [userId];

  if (filters.unreadOnly) {
    query += ' AND is_read = FALSE';
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    // Note: Always use parameterized queries for LIMIT if the value comes from users
    // But for a quick fix, parseInt ensures it's a number.
    query += ` LIMIT ${parseInt(filters.limit)}`;
  }

  const result = await db.query(query, params);
  return result.rows;
}

async function markNotificationAsRead(notificationId, userId) {
  const result = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );

  return result.rows[0] || null;
}

async function markAllNotificationsAsRead(userId) {
  const result = await db.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING id',
    [userId]
  );

  return result.rowCount;
}

async function deleteNotification(notificationId, userId) {
  const result = await db.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [notificationId, userId]
  );

  return result.rows[0] || null;
}

async function getUnreadCount(userId) {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );

  return parseInt(result.rows[0].count);
}

module.exports = {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
};