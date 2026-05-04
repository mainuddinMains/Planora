const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

// Ensure a fresh app + mocked db even if another test file loaded `app` first.
jest.resetModules();
const app = require('../app');
const db = require('../db');

describe('Auth routes with mocked database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and sets cookie on success', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 101,
              email: 'newuser@example.edu',
              name: 'New User',
              avatar_url: null,
            },
          ],
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.edu',
          password: 'secret12',
          name: 'New User',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.user).toEqual({
        id: 101,
        email: 'newuser@example.edu',
        name: 'New User',
        avatar_url: null,
      });
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('token=')])
      );
    });

    it('returns 409 when email already exists', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'taken@example.edu',
          password: 'secret12',
          name: 'Someone',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'Email already registered' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 401 for wrong password', async () => {
      const hash = await bcrypt.hash('correctpass', 4);
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            email: 'student@example.edu',
            password_hash: hash,
            name: 'Student',
            avatar_url: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@example.edu', password: 'wrongpass' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
    });

    it('returns 200 and sets cookie on success', async () => {
      const hash = await bcrypt.hash('mypassword', 4);
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            email: 'ok@example.edu',
            password_hash: hash,
            name: 'OK User',
            avatar_url: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ok@example.edu', password: 'mypassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('token=')])
      );
    });

    it('returns 400 for Google-only account', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 4,
            email: 'google@example.edu',
            password_hash: null,
            name: 'G User',
            avatar_url: null,
          },
        ],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'google@example.edu', password: 'anything' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Google sign-in/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Not authenticated' });
    });

    it('returns 200 with user for valid token', async () => {
      const token = jwt.sign(
        { userId: 7, email: 'me@example.edu' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            email: 'me@example.edu',
            name: 'Me',
            avatar_url: 'https://x.test/a.png',
          },
        ],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toEqual({
        id: 7,
        email: 'me@example.edu',
        name: 'Me',
        avatar_url: 'https://x.test/a.png',
      });
    });

    it('returns 401 when user no longer exists', async () => {
      const token = jwt.sign(
        { userId: 999, email: 'gone@example.edu' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`]);

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'User not found' });
    });
  });
});
