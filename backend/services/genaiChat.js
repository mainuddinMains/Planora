const axios = require('axios');

const MAX_USER_MESSAGE = 8000;
const MAX_TASK_SUMMARY = 6000;
const MAX_PRIOR_MESSAGES = 20;
const MAX_MESSAGE_CONTENT = 4000;

function isConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);
}

function trimMessages(priorMessages) {
  if (!Array.isArray(priorMessages)) return [];
  return priorMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_PRIOR_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: String(m.content || '').slice(0, MAX_MESSAGE_CONTENT),
    }));
}

/**
 * @param {{ userMessage: string, taskSummary?: string, priorMessages?: Array<{role: string, content: string}> }} params
 * @returns {Promise<string>}
 */
async function sendChat({ userMessage, taskSummary = '', priorMessages = [] }) {
  const user = String(userMessage || '').trim().slice(0, MAX_USER_MESSAGE);
  if (!user) {
    throw new Error('Empty message');
  }

  const summary = String(taskSummary || '').slice(0, MAX_TASK_SUMMARY);
  const system = [
    'You are a helpful study assistant inside Planora, a student task and planning app.',
    'Be concise, encouraging, and practical about scheduling, coursework, and productivity.',
    summary ? `Task context from the student (may be partial):\n${summary}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages = [
    { role: 'system', content: system },
    ...trimMessages(priorMessages),
    { role: 'user', content: user },
  ];

  if (process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const { data } = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model, messages, max_tokens: 1024 },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 60000,
      }
    );
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(data?.error?.message || 'Empty response from OpenAI');
    }
    return text;
  }

  if (process.env.OPENROUTER_API_KEY) {
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model, messages, max_tokens: 1024 },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:3000',
          'X-Title': 'Planora',
        },
        timeout: 60000,
      }
    );
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(data?.error?.message || 'Empty response from OpenRouter');
    }
    return text;
  }

  throw new Error('No AI provider configured');
}

module.exports = {
  isConfigured,
  sendChat,
  MAX_USER_MESSAGE,
};
