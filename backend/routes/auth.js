const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const googleOAuth = require('../services/googleOAuth');

// Ensure JWT_SECRET exists to prevent 500 errors
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

const COOKIE_OPTIONS = {
  httpOnly: true,
  // Use 'secure: true' only in production (requires HTTPS)
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};
const GOOGLE_STATE_COOKIE = 'google_oauth_state';
const GOOGLE_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 10 * 60 * 1000
};

function normalizeEmail(email) {
  return email?.trim().toLowerCase();
}

function buildAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url || null,
  };
}

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, COOKIE_OPTIONS);
}

function sendAuthResponse(res, statusCode, message, user) {
  setAuthCookie(res, user);
  res.status(statusCode).json({
    message,
    user: buildAuthUser(user),
  });
}

function clearGoogleStateCookie(res) {
  res.clearCookie(GOOGLE_STATE_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url',
      [normalizedEmail, passwordHash, name]
    );

    sendAuthResponse(res, 201, 'Registration successful', result.rows[0]);
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ error: 'Registration failed internal server error' });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Debug Log: Remove once fixed
    console.log(`Attempting login for: ${normalizedEmail}`);

    const result = await db.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      'SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      console.log('Login Fail: User not found in database');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password against the hash
    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account uses Google sign-in. Continue with Google instead.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('Login Fail: Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    sendAuthResponse(res, 200, 'Login successful', user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/google/auth-url', (req, res) => {
  if (!googleOAuth.isConfigured()) {
    return res.status(503).json({ error: 'Google sign-in is not configured on this server.' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  res.cookie(GOOGLE_STATE_COOKIE, state, GOOGLE_STATE_COOKIE_OPTIONS);
  res.json({ authUrl: googleOAuth.getLoginAuthUrl(state) });
});

router.post('/google/login', async (req, res) => {
  const { code, state } = req.body;
  const expectedState = req.cookies[GOOGLE_STATE_COOKIE];

  clearGoogleStateCookie(res);

  if (!googleOAuth.isConfigured()) {
    return res.status(503).json({ error: 'Google sign-in is not configured on this server.' });
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Google authorization code and state are required.' });
  }

  if (!expectedState || state !== expectedState) {
    return res.status(400).json({ error: 'Google sign-in could not be verified. Please try again.' });
  }

  let client;

  try {
    const tokenData = await googleOAuth.getTokenFromCode(code);
    const googleUser = await googleOAuth.getUserInfo(tokenData.access_token);
    const email = normalizeEmail(googleUser.email);

    if (!googleUser.sub || !email) {
      return res.status(400).json({ error: 'Google account information is incomplete.' });
    }

    if (googleUser.email_verified === false) {
      return res.status(400).json({ error: 'Google account email must be verified before signing in.' });
    }

    client = await db.pool.connect();
    await client.query('BEGIN');

    let user;

    const googleMatch = await client.query(
      'SELECT id, email, name, avatar_url FROM users WHERE google_id = $1',
      [googleUser.sub]
    );

    if (googleMatch.rows.length > 0) {
      const emailOwner = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      const canUpdateEmail =
        emailOwner.rows.length === 0 || emailOwner.rows[0].id === googleMatch.rows[0].id;

      const updated = await client.query(
        `UPDATE users
         SET email = CASE WHEN $1 THEN $2 ELSE email END,
             name = COALESCE(NULLIF($3, ''), name),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, email, name, avatar_url`,
        [canUpdateEmail, email, googleUser.name || '', googleUser.picture || null, googleMatch.rows[0].id]
      );
      user = updated.rows[0];
    } else {
      const emailMatch = await client.query(
        'SELECT id, email, name, avatar_url FROM users WHERE email = $1',
        [email]
      );

      if (emailMatch.rows.length > 0) {
        const linked = await client.query(
          `UPDATE users
           SET google_id = $1,
               avatar_url = COALESCE($2, avatar_url),
               updated_at = NOW()
           WHERE id = $3
           RETURNING id, email, name, avatar_url`,
          [googleUser.sub, googleUser.picture || null, emailMatch.rows[0].id]
        );
        user = linked.rows[0];
      } else {
        const displayName = googleUser.name?.trim() || email.split('@')[0];
        const created = await client.query(
          `INSERT INTO users (email, password_hash, name, google_id, avatar_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, name, avatar_url`,
          [email, null, displayName, googleUser.sub, googleUser.picture || null]
        );
        user = created.rows[0];
      }
    }

    await client.query('COMMIT');
    sendAuthResponse(res, 200, 'Google sign-in successful', user);
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ error: 'Login failed due to server error' });
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Google login error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Google sign-in failed' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// --- LOGOUT ROUTE ---
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

// --- AUTH CHECK ROUTE ---
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await db.query(
      'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: buildAuthUser(result.rows[0]) });
  } catch (error) {
    console.error('Auth check error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
