const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const microsoftOAuth = require('../services/microsoftOAuth');
const emailSourceService = require('../services/emailSourceService');

router.get('/auth-url', requireAuth, async (req, res) => {
  try {
    const authUrl = microsoftOAuth.getAuthUrl(req.user.userId.toString());
    res.json({ authUrl });
  } catch (err) {
    console.error('Get auth URL error:', err);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

router.post('/token', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokenData = await microsoftOAuth.getTokenFromCode(code);
    
    await emailSourceService.upsertSource(req.user.userId, {
      provider: 'microsoft_oauth',
      host: 'graph.microsoft.com',
      username: req.user.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    });

    res.json({ 
      message: 'Account connected successfully',
      expires_in: tokenData.expires_in 
    });
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect account' });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const sources = await emailSourceService.getSourcesForUser(req.user.userId);
    const oauthSource = sources.find(s => s.provider === 'microsoft_oauth');
    
    if (!oauthSource) {
      return res.json({ connected: false });
    }

    const isExpired = oauthSource.expires_at && new Date(oauthSource.expires_at) < new Date();
    
    res.json({
      connected: true,
      email: oauthSource.username,
      expiresAt: oauthSource.expires_at,
      needsRefresh: isExpired
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const sources = await emailSourceService.getSourcesForUser(req.user.userId);
    const oauthSource = sources.find(s => s.provider === 'microsoft_oauth');
    
    if (oauthSource) {
      await emailSourceService.deleteSource(oauthSource.id, req.user.userId);
    }

    res.json({ message: 'Disconnected successfully' });
  } catch (err) {
    console.error('Disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
