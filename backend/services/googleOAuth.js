const axios = require('axios');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const USERINFO_API = 'https://www.googleapis.com/oauth2/v3/userinfo';

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: state || '',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function getTokenFromCode(authCode) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: authCode,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

async function getUserInfo(accessToken) {
  const response = await axios.get(USERINFO_API, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}

async function getAccessToken(tokenRow, db) {
  const now = new Date();
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;
  const needsRefresh = !expiresAt || expiresAt <= new Date(now.getTime() + 60 * 1000);

  if (!needsRefresh) return tokenRow.access_token;

  if (!tokenRow.refresh_token) throw new Error('No refresh token available. Please reconnect Google Calendar.');

  const refreshed = await refreshAccessToken(tokenRow.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

  await db.query(
    'UPDATE google_calendar_tokens SET access_token = $1, expires_at = $2, updated_at = NOW() WHERE user_id = $3',
    [refreshed.access_token, newExpiresAt, tokenRow.user_id]
  );

  return refreshed.access_token;
}

async function listUpcomingEvents(accessToken, maxResults = 20) {
  // Use start of today so events that already started today are still shown
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const response = await axios.get(`${CALENDAR_API}/calendars/primary/events`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      timeMin: startOfToday.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    },
  });
  return response.data.items || [];
}

async function createEvent(accessToken, event) {
  const response = await axios.post(
    `${CALENDAR_API}/calendars/primary/events`,
    event,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

async function updateEvent(accessToken, eventId, event) {
  const response = await axios.put(
    `${CALENDAR_API}/calendars/primary/events/${eventId}`,
    event,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

async function deleteEvent(accessToken, eventId) {
  await axios.delete(
    `${CALENDAR_API}/calendars/primary/events/${eventId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

module.exports = {
  getAuthUrl,
  getTokenFromCode,
  refreshAccessToken,
  getUserInfo,
  getAccessToken,
  listUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  REDIRECT_URI,
};
