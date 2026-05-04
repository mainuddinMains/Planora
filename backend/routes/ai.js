const express = require('express');
const { requireAuth } = require('../middleware/auth');
const genai = require('../services/genaiChat');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    configured: genai.isConfigured(),
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    },
  });
});

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const raw = req.body?.message;
    const message = typeof raw === 'string' ? raw.trim() : '';
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > genai.MAX_USER_MESSAGE) {
      return res.status(400).json({ error: 'message is too long' });
    }

    if (!genai.isConfigured()) {
      return res.status(503).json({
        error:
          'AI provider is not configured on this server. Ask your admin to set OPENAI_API_KEY or OPENROUTER_API_KEY, or use Planora AI (local).',
        configured: false,
      });
    }

    const taskSummary =
      typeof req.body.taskSummary === 'string' ? req.body.taskSummary : '';
    const priorMessages = Array.isArray(req.body.messages) ? req.body.messages : [];

    const reply = await genai.sendChat({
      userMessage: message,
      taskSummary,
      priorMessages,
    });

    res.json({ reply });
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err.message || 'AI request failed';
    console.error('[ai/chat]', msg);
    res.status(502).json({ error: msg });
  }
});

module.exports = router;
