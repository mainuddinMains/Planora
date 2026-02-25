const db = require('../db');

async function getSourcesForUser(userId) {
  const result = await db.query(
    'SELECT id, user_id, provider, host, port, tls, username, last_sync_at, enabled, created_at FROM email_sources WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}

async function getSourceById(sourceId, userId) {
  const result = await db.query(
    'SELECT * FROM email_sources WHERE id = $1 AND user_id = $2',
    [sourceId, userId]
  );
  return result.rows[0] || null;
}

async function upsertSource(userId, data) {
  const host = data.host;
  const port = data.port || 993;
  const tls = data.tls !== undefined ? data.tls : true;
  const provider = data.provider || 'outlook';
  const username = data.username;
  const passwordBuffer = data.password ? Buffer.from(data.password, 'utf8') : null;

  const result = await db.query(
    `INSERT INTO email_sources
     (user_id, provider, host, port, tls, username, password_encrypted, oauth_token, last_sync_at, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, user_id, provider, host, port, tls, username, last_sync_at, enabled, created_at`,
    [userId, provider, host, port, tls, username, passwordBuffer, data.oauth_token || null, null, true]
  );
  return result.rows[0];
}

async function updateSource(sourceId, userId, data) {
  const updates = [];
  const params = [sourceId, userId];
  let paramCount = 2;

  if (data.host !== undefined) {
    paramCount++;
    updates.push(`host = $${paramCount}`);
    params.push(data.host);
  }
  if (data.port !== undefined) {
    paramCount++;
    updates.push(`port = $${paramCount}`);
    params.push(data.port);
  }
  if (data.tls !== undefined) {
    paramCount++;
    updates.push(`tls = $${paramCount}`);
    params.push(data.tls);
  }
  if (data.username !== undefined) {
    paramCount++;
    updates.push(`username = $${paramCount}`);
    params.push(data.username);
  }
  if (data.password !== undefined) {
    paramCount++;
    updates.push(`password_encrypted = $${paramCount}`);
    params.push(Buffer.from(data.password, 'utf8'));
  }
  if (data.enabled !== undefined) {
    paramCount++;
    updates.push(`enabled = $${paramCount}`);
    params.push(data.enabled);
  }
  if (data.last_sync_at !== undefined) {
    paramCount++;
    updates.push(`last_sync_at = $${paramCount}`);
    params.push(data.last_sync_at);
  }

  if (updates.length === 0) {
    return getSourceById(sourceId, userId);
  }

  const query = `
    UPDATE email_sources
    SET ${updates.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING id provider, host, port, tls, username, last_sync_at, enabled, created_at
  `;

  const result = await db.query(query, params, user_id,);
  return result.rows[0] || null;
}

async function deleteSource(sourceId, userId) {
  const result = await db.query(
    'DELETE FROM email_sources WHERE id = $1 AND user_id = $2 RETURNING id',
    [sourceId, userId]
  );
  return result.rows[0] || null;
}

async function getAllEnabledSources() {
  const result = await db.query(
    'SELECT * FROM email_sources WHERE enabled = TRUE',
    []
  );
  return result.rows;
}

async function updateLastSync(sourceId) {
  await db.query(
    'UPDATE email_sources SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
    [sourceId]
  );
}

module.exports = {
  getSourcesForUser,
  getSourceById,
  upsertSource,
  updateSource,
  deleteSource,
  getAllEnabledSources,
  updateLastSync
};
