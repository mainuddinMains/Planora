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

// GET /api/google-calendar/events  — fetch events for a given month (or upcoming)
router.get('/events', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM google_calendar_tokens WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });

    const tokenRow = result.rows[0];
    const accessToken = await googleOAuth.getAccessToken(tokenRow, db);

    // Support ?year=2026&month=3 for full month fetching
    const axios = require('axios');
    let timeMin, timeMax;
    if (req.query.year && req.query.month) {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month) - 1; // JS months 0-indexed
      timeMin = new Date(year, month, 1);
      timeMax = new Date(year, month + 1, 0, 23, 59, 59);
    } else {
      timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 60);
    }

    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      },
    });
    res.json({ events: response.data.items || [] });
  } catch (err) {
    console.error('Google events error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch events' });
  }
});

function googleErrMsg(err) {
  return err.response?.data?.error?.message
    || err.response?.data?.error
    || err.message
    || 'Unknown error';
}

// POST /api/google-calendar/events — create a new event
router.post('/events', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM google_calendar_tokens WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });
    const accessToken = await googleOAuth.getAccessToken(result.rows[0], db);
    const event = await googleOAuth.createEvent(accessToken, req.body);
    res.json(event);
  } catch (err) {
    console.error('Google create event error:', err.response?.data || err.message);
    res.status(500).json({ error: googleErrMsg(err) });
  }
});

// PUT /api/google-calendar/events/:eventId — update an event
router.put('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM google_calendar_tokens WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });
    const accessToken = await googleOAuth.getAccessToken(result.rows[0], db);
    const event = await googleOAuth.updateEvent(accessToken, req.params.eventId, req.body);
    res.json(event);
  } catch (err) {
    console.error('Google update event error:', err.response?.data || err.message);
    res.status(500).json({ error: googleErrMsg(err) });
  }
});

// DELETE /api/google-calendar/events/:eventId — delete an event
router.delete('/events/:eventId', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM google_calendar_tokens WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Google Calendar not connected' });
    const accessToken = await googleOAuth.getAccessToken(result.rows[0], db);
    await googleOAuth.deleteEvent(accessToken, req.params.eventId);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Google delete event error:', err.response?.data || err.message);
    res.status(500).json({ error: googleErrMsg(err) });
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
