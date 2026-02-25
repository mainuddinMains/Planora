const cron = require('node-cron');
const runner = require('../services/emailSyncRunner');

function startEmailSyncJobs() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runner.syncAllUsers();
    } catch (e) {
      console.error('[EmailSyncJob] Sync failed:', e.message);
    }
  });
  console.log('[EmailSyncJob] Email sync jobs scheduled (every 15 minutes)');
}

module.exports = { startEmailSyncJobs };
