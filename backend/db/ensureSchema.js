const db = require('./index');

const schemaUpdates = [
  'ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL',
];

async function ensureSchema() {
  for (const statement of schemaUpdates) {
    await db.query(statement);
  }
}

module.exports = {
  ensureSchema,
};
