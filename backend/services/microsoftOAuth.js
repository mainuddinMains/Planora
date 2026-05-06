const axios = require('axios');

const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000';

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: 'Mail.Read offline_access',
    state: state
  });
  
  return `${AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;
}

async function getTokenFromCode(authCode) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: authCode,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: 'Mail.Read offline_access'
  });

  const response = await axios.post(`${AUTHORITY}/oauth2/v2.0/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'Mail.Read offline_access'
  });

  const response = await axios.post(`${AUTHORITY}/oauth2/v2.0/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

async function getUserInfo(accessToken) {
  const response = await axios.get(`${GRAPH_ENDPOINT}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.data;
}

async function getRecentEmails(accessToken, maxResults = 30) {
  const response = await axios.get(
    `${GRAPH_ENDPOINT}/me/mailfolders/inbox/messages?$top=${maxResults}&$select=subject,from,receivedDateTime,bodyPreview,webLink&$orderby=receivedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.data.value;
}

module.exports = {
  getAuthUrl,
  getTokenFromCode,
  refreshAccessToken,
  getUserInfo,
  getRecentEmails,
  REDIRECT_URI
};
