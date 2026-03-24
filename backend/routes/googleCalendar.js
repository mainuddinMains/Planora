const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const googleOAuth = require('../services/googleOAuth');
const db = require('../db');

// GET /api/google-calendar/auth-url
router.get('/auth-url', requireAuth, (req, res) => {
  try {
    const authUrl = googleOAuth.getAuthUrl(req.user.userId.toString());
    res.json({ authUrl });
  } catch (err) {
    console.error('Google auth-url error:', err);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// POST /api/google-calendar/token
router.post('/token', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code is required' });

    const tokenData = await googleOAuth.getTokenFromCode(code);
    const userInfo = await googleOAuth.getUserInfo(tokenData.access_token);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.query(
      `INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, expires_at, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_calendar_tokens.refresh_token),
         expires_at = EXCLUDED.expires_at,
         email = EXCLUDED.email,
         updated_at = NOW()`,
      [req.user.userId, tokenData.access_token, tokenData.refresh_token || null, expiresAt, userInfo.email]
    );

    res.json({ message: 'Google Calendar connected successfully', email: userInfo.email });
  } catch (err) {
    console.error('Google token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// GET /api/google-calendar/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT email, expires_at FROM google_calendar_tokens WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.json({ connected: false });

    const row = result.rows[0];
    const needsRefresh = row.expires_at && new Date(row.expires_at) < new Date();
    res.json({ connected: true, email: row.email, needsRefresh });
  } catch (err) {
    console.error('Google status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// POST /api/google-calendar/disconnect
router.post('/disconnect', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM google_calendar_tokens WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'Google Calendar disconnected' });
  } catch (err) {
    console.error('Google disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// GET /api/google-calendar/events
router.get('/events', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM google_calendar_tokens WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });

    const tokenRow = result.rows[0];
    const accessToken = await googleOAuth.getAccessToken(tokenRow, db);
    const maxResults = parseInt(req.query.maxResults) || 20;
    const events = await googleOAuth.listUpcomingEvents(accessToken, maxResults);

    res.json({ events });
  } catch (err) {
    console.error('Google events error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch events' });
  }
});

// POST /api/google-calendar/export-task/:taskId
router.post('/export-task/:taskId', requireAuth, async (req, res) => {
  try {
    const tokenResult = await db.query(
      'SELECT * FROM google_calendar_tokens WHERE user_id = $1',
      [req.user.userId]
    );
    if (tokenResult.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });

    const taskResult = await db.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.taskId, req.user.userId]
    );
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const task = taskResult.rows[0];
    const tokenRow = tokenResult.rows[0];
    const accessToken = await googleOAuth.getAccessToken(tokenRow, db);

    const dueDate = task.due_date ? new Date(task.due_date) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startTime = dueDate.toISOString();
    const endTime = new Date(dueDate.getTime() + (task.duration || 60) * 60 * 1000).toISOString();

    const event = {
      summary: task.title,
      description: task.description || `Priority: ${task.priority || 'medium'} | Added from Planora`,
      start: { dateTime: startTime, timeZone: 'UTC' },
      end: { dateTime: endTime, timeZone: 'UTC' },
      colorId: task.priority === 'high' ? '11' : task.priority === 'low' ? '2' : '5',
    };

    const created = await googleOAuth.createEvent(accessToken, event);
    res.json({ message: 'Task exported to Google Calendar', eventId: created.id, htmlLink: created.htmlLink });
  } catch (err) {
    console.error('Google export error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to export task' });
  }
});

module.exports = router;
