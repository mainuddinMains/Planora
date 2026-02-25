const emailOutlookSyncService = require('./emailOutlookSyncService');

async function syncAllUsers() {
  console.log('[EmailSync] Starting sync for all users');
  await emailOutlookSyncService.syncAllUsers();
  console.log('[EmailSync] Sync completed');
}

module.exports = { syncAllUsers };
