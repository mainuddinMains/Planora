const request = require('supertest');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = require('../app');

describe('AI routes', () => {
  describe('GET /api/ai/status', () => {
    it('returns configured flags', async () => {
      const res = await request(app).get('/api/ai/status');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('configured');
      expect(res.body).toHaveProperty('providers');
      expect(res.body.providers).toHaveProperty('openai');
      expect(res.body.providers).toHaveProperty('openrouter');
    });
  });

  describe('POST /api/ai/chat', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Hello' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Authentication required' });
    });

    it('returns 400 when message is missing', async () => {
      const token = jwt.sign(
        { userId: 1, email: 'u@test.edu' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Cookie', [`token=${token}`])
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'message is required' });
    });

    it('returns 503 when no provider is configured', async () => {
      const prevOpenai = process.env.OPENAI_API_KEY;
      const prevOr = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const token = jwt.sign(
        { userId: 1, email: 'u@test.edu' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      try {
        const res = await request(app)
          .post('/api/ai/chat')
          .set('Cookie', [`token=${token}`])
          .send({ message: 'Hi' });

        expect(res.statusCode).toBe(503);
        expect(res.body.configured).toBe(false);
        expect(res.body.error).toMatch(/not configured/i);
      } finally {
        if (prevOpenai !== undefined) process.env.OPENAI_API_KEY = prevOpenai;
        if (prevOr !== undefined) process.env.OPENROUTER_API_KEY = prevOr;
      }
    });

    it('returns 200 with reply when OpenAI env is set and API succeeds', async () => {
      const prevOpenai = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-mock';

      const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Mocked assistant reply.' } }],
        },
      });

      const token = jwt.sign(
        { userId: 2, email: 'ai@test.edu' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      try {
        const res = await request(app)
          .post('/api/ai/chat')
          .set('Cookie', [`token=${token}`])
          .send({ message: 'What is 2+2?', taskSummary: 'Math study' });

        expect(res.statusCode).toBe(200);
        expect(res.body.reply).toBe('Mocked assistant reply.');
        expect(postSpy).toHaveBeenCalled();
      } finally {
        postSpy.mockRestore();
        if (prevOpenai !== undefined) process.env.OPENAI_API_KEY = prevOpenai;
        else delete process.env.OPENAI_API_KEY;
      }
    });
  });
});
