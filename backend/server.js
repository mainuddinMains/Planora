require('dotenv').config();
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
