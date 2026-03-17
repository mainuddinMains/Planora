require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const courseRoutes = require('./routes/courses');
const recommendationRoutes = require('./routes/recommendations');
const notificationRoutes = require('./routes/notifications');
const { startNotificationJobs } = require('./jobs/notificationJob');

let emailSourceRoutes = null;
let emailSyncRoutes = null;
let microsoftAuthRoutes = null;
let startEmailSyncJobs = null;

try {
  emailSourceRoutes = require('./routes/emailSources');
  emailSyncRoutes = require('./routes/emailSync');
  microsoftAuthRoutes = require('./routes/microsoftAuth');
  ({ startEmailSyncJobs } = require('./jobs/emailSyncJob'));
} catch (error) {
  console.warn(
    `[EmailSync] Optional email sync modules disabled: ${error.message}`
  );
}

const app = express();

const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : [...new Set([...devOrigins, ...envOrigins])];

const devIpOriginRegex = /^http:\/\/(\d{1,3}\.){3}\d{1,3}:(3000|5173)$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowedDevIp =
        process.env.NODE_ENV !== 'production' && devIpOriginRegex.test(origin);

      if (allowedOrigins.includes(origin) || isAllowedDevIp) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Planora API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);

if (emailSourceRoutes && emailSyncRoutes) {
  app.use('/api/email_sources', emailSourceRoutes);
  app.use('/api/email', emailSyncRoutes);
}

if (microsoftAuthRoutes) {
  app.use('/api/microsoft', microsoftAuthRoutes);
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.NODE_ENV !== 'test') {
    startNotificationJobs();
    if (startEmailSyncJobs) {
      startEmailSyncJobs();
    }
  }
});
