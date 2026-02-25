const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const emailSourceService = require('../services/emailSourceService');

router.get('/', requireAuth, async (req, res) => {
  try {
    const sources = await emailSourceService.getSourcesForUser(req.user.userId);
    res.json(sources);
  } catch (err) {
    console.error('Get email sources error:', err);
    res.status(500).json({ error: 'Failed to fetch email sources' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { host, port, tls, username, password, provider, oauth_token } = req.body;

    if (!username || !host) {
      return res.status(400).json({ error: 'Host and username are required' });
    }

    const source = await emailSourceService.upsertSource(req.user.userId, {
      host,
      port,
      tls,
      username,
      password,
      provider,
      oauth_token
    });
    res.json(source);
  } catch (err) {
    console.error('Create email source error:', err);
    res.status(500).json({ error: 'Failed to create email source' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const source = await emailSourceService.updateSource(
      req.params.id,
      req.user.userId,
      req.body
    );

    if (!source) {
      return res.status(404).json({ error: 'Email source not found' });
    }

    res.json(source);
  } catch (err) {
    console.error('Update email source error:', err);
    res.status(500).json({ error: 'Failed to update email source' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const source = await emailSourceService.deleteSource(req.params.id, req.user.userId);

    if (!source) {
      return res.status(404).json({ error: 'Email source not found' });
    }

    res.json({ message: 'Email source deleted successfully' });
  } catch (err) {
    console.error('Delete email source error:', err);
    res.status(500).json({ error: 'Failed to delete email source' });
  }
});

module.exports = router;
