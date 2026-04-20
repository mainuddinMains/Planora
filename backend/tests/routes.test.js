const request = require('supertest');
const app = require('../app');

describe('Backend route smoke/validation tests', () => {
  describe('GET /api/health', () => {
    it('returns backend health payload', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        message: 'Planora API is running',
      });
    });
  });

  describe('Auth route input validation', () => {
    it('POST /api/auth/register rejects missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: 'Email, password, and name are required',
      });
    });

    it('POST /api/auth/register rejects short passwords', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'student@example.edu',
        password: '123',
        name: 'Student',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: 'Password must be at least 6 characters',
      });
    });

    it('POST /api/auth/login rejects missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: 'Email and password are required',
      });
    });
  });

  describe('Protected route guards', () => {
    it('GET /api/tasks requires authentication', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('GET /api/courses requires authentication', async () => {
      const res = await request(app).get('/api/courses');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });
  });
});
