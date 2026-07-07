require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}
if (process.env.JWT_SECRET === 'your_super_secure_jwt_secret_change_in_production') {
  console.warn('WARNING: JWT_SECRET is set to the default placeholder value. Change it before deploying.');
}

const app = require('./app');
const { ensureSchema } = require('./db/ensureSchema');
const { startNotificationJobs } = require('./jobs/notificationJob');
let startEmailSyncJobs = null;

try {
  ({ startEmailSyncJobs } = require('./jobs/emailSyncJob'));
} catch (error) {
  console.warn(
    `[EmailSync] Optional email sync modules disabled: ${error.message}`
  );
}

const PORT = process.env.PORT || 5001;

async function startServer() {
  await ensureSchema();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    if (process.env.NODE_ENV !== 'test') {
      startNotificationJobs();
      if (startEmailSyncJobs) {
        startEmailSyncJobs();
      }
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
