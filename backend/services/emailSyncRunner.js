const emailOutlookSyncService = require('./emailOutlookSyncService');
const emailOAuthSyncService = require('./emailOAuthSyncService');

async function syncAllUsers() {
  console.log('[EmailSync] Starting sync for all users');
  
  // Sync IMAP sources
  try {
    await emailOutlookSyncService.syncAllUsers();
  } catch (err) {
    console.error('[EmailSync] IMAP sync error:', err.message);
  }
  
  // Sync OAuth sources
  try {
    await emailOAuthSyncService.syncAllUsers();
  } catch (err) {
    console.error('[EmailSync] OAuth sync error:', err.message);
  }
  
  console.log('[EmailSync] All syncs completed');
}

module.exports = { syncAllUsers };
