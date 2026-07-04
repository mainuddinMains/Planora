require('dotenv').config();
const app = require('./app');
const { ensureSchema } = require('./db/ensureSchema');
const { startNotificationJobs } = require('./jobs/notificationJob');
let startEmailSyncJobs = null;

try {
  ({ startEmailSyncJobs } = require('./jobs/emailSyncJob'));
} catch (error) {
  console.warn(
    `[EmailSync] Optional email sync modules disabled: ${error.message}`
  );
}
const PORT = process.env.PORT || 5001;

async function startServer() {
  await ensureSchema();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    if (process.env.NODE_ENV !== 'test') {
      startNotificationJobs();
      if (startEmailSyncJobs) {
        startEmailSyncJobs();
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
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
