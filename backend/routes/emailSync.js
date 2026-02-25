const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const emailSyncRunner = require('../services/emailSyncRunner');

router.post('/now', requireAuth, async (req, res) => {
  try {
    await emailSyncRunner.syncAllUsers();
    res.json({ message: 'Email sync started successfully' });
  } catch (err) {
    console.error('Email sync error:', err);
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const sources = await require('../services/emailSourceService').getSourcesForUser(req.user.userId);
    res.json({ 
      sources: sources.map(s => ({
        id: s.id,
        host: s.host,
        username: s.username,
        last_sync_at: s.last_sync_at,
        enabled: s.enabled
      }))
    });
  } catch (err) {
    console.error('Get sync status error:', err);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

module.exports = router;
