# Planora - Campus Task & Study Planner

Planora is a smart academic planning web application that helps students manage deadlines, prioritize tasks, and generate structured daily study plans. Built with React, Node.js/Express, and PostgreSQL.

![Planora](https://img.shields.io/badge/Planora-Task%20Planner-4a90a4)

## Features

- **User Authentication** - Secure JWT-based authentication with httpOnly cookies
- **Task & Course Management** - Create, update, delete, and track tasks by course and priority
- **AI Study Assistant** - In-app assistant for task insights, scheduling tips, and productivity guidance
- **Today + Weekly Planning** - Recommendation engine for daily priorities and weekly workload
- **Notifications** - In-app notification bell plus automated reminder generation every 15 minutes
- **Microsoft Email Sync** - OAuth connection + scheduled inbox sync to convert emails into tasks
- **Multilingual UI** - 42-language selector with search, persistence, and RTL support (`ar`, `he`, `ur`)
- **Dockerized Stack** - One-command local startup for frontend, backend, and PostgreSQL

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, React Router DOM, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (local 15/16+) |
| Authentication | JWT, bcrypt, httpOnly cookies |
| Background Jobs | node-cron |
| Email + Parsing | Microsoft Graph OAuth, axios, chrono-node, imapflow, mailparser |

## Internationalization

- UI language state is managed by `frontend/src/hooks/useLanguage.js`
- Language preference is persisted in `localStorage`
- Navbar includes a searchable language dropdown
- RTL is automatically enabled for `ar`, `he`, and `ur`
- Current language list includes 42 options (English default + multilingual set)

## Project Structure

```
Planora/
├── backend/
│   ├── db/
│   │   ├── index.js              # Database connection pool
│   │   └── schema.sql            # PostgreSQL schema
│   ├── jobs/
│   │   ├── notificationJob.js    # Cron job for notifications
│   │   └── emailSyncJob.js       # Cron job for email sync
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── courses.js            # Course CRUD endpoints
│   │   ├── emailSources.js       # Email source CRUD endpoints
│   │   ├── emailSync.js          # Email sync trigger/status endpoints
│   │   ├── microsoftAuth.js      # Microsoft OAuth endpoints
│   │   ├── notifications.js      # Notification endpoints
│   │   ├── recommendations.js    # Recommendation engine endpoints
│   │   ├── tasks.js              # Task CRUD endpoints
│   │   └── index.js
│   ├── services/
│   │   ├── courseService.js      # Course database operations
│   │   ├── emailOAuthSyncService.js
│   │   ├── emailOutlookSyncService.js
│   │   ├── emailSourceService.js
│   │   ├── emailSyncRunner.js
│   │   ├── microsoftOAuth.js
│   │   ├── notificationService.js # Notification database operations
│   │   ├── recommendationService.js # Scoring algorithm
│   │   ├── taskService.js        # Task database operations
│   │   └── index.js
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js          # API client functions
│   │   ├── components/
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TaskItem.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Authentication hook
│   │   │   ├── useCourses.js     # Courses state hook
│   │   │   ├── useEmailSources.js
│   │   │   ├── useLanguage.js    # i18n and language state
│   │   │   ├── useNotifications.js
│   │   │   ├── useTasks.js       # Tasks state hook
│   │   │   ├── useWeeklyTasks.js
│   │   │   └── index.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmailSync.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── TodayPlan.jsx
│   │   │   ├── WeeklyCalendar.jsx
│   │   │   └── index.js
│   │   ├── App.jsx               # Main app with routing
│   │   ├── App.css               # Global styles
│   │   └── index.js              # React entry point
│   └── package.json
│
├── docker-compose.yml            # Docker containers setup
├── backend/Dockerfile            # Backend Docker image
├── frontend/Dockerfile           # Frontend Docker image
├── .env.docker                   # Docker env template
└── README.md
```

## Code File Descriptions

### Backend Files

| File | Description |
|------|-------------|
| `server.js` | Express app entry point - starts the server, connects to DB, loads routes |
| `db/index.js` | PostgreSQL connection pool using `pg` library |
| `db/schema.sql` | SQL commands to create all database tables and indexes |
| `middleware/auth.js` | Protects routes - verifies JWT tokens from cookies |
| `routes/auth.js` | User registration, login, logout, get current user |
| `routes/tasks.js` | CRUD operations for tasks (create, read, update, delete) |
| `routes/courses.js` | CRUD operations for courses |
| `routes/notifications.js` | Get, mark read, delete notifications |
| `routes/recommendations.js` | AI-powered task prioritization and workload analysis |
| `routes/microsoftAuth.js` | Microsoft OAuth connect/status/disconnect |
| `routes/emailSources.js` | User email source CRUD |
| `routes/emailSync.js` | Trigger sync and check sync status |
| `services/microsoftOAuth.js` | Microsoft OAuth + Graph API helpers |
| `services/emailSourceService.js` | Email source persistence |
| `services/emailSyncRunner.js` | Batch sync coordinator |
| `services/taskService.js` | Database queries for tasks |
| `services/courseService.js` | Database queries for courses |
| `services/notificationService.js` | Database queries for notifications |
| `services/recommendationService.js` | Scoring algorithm for task prioritization |
| `jobs/notificationJob.js` | Scheduled job (runs every 15 min) to create deadline reminders |
| `jobs/emailSyncJob.js` | Scheduled job (runs every 15 min) to sync connected inboxes |

### Frontend Files

| File | Description |
|------|-------------|
| `App.jsx` | Main React component - sets up routing and navigation |
| `index.js` | React entry point - renders the App |
| `api/index.js` | Functions to call backend APIs (fetch wrapper) |
| `hooks/useAuth.js` | Manages user login state globally |
| `hooks/useLanguage.js` | Language context, translations, and RTL/LTR switching |
| `hooks/useTasks.js` | Manages tasks state and CRUD operations |
| `hooks/useCourses.js` | Manages courses state |
| `hooks/useEmailSources.js` | Email source state helpers |
| `hooks/useNotifications.js` | Manages notifications state |
| `pages/Dashboard.jsx` | Main dashboard - shows tasks and AI assistant |
| `pages/Login.jsx` | Login and registration form |
| `pages/Tasks.jsx` | Full task list with filters |
| `pages/WeeklyCalendar.jsx` | Weekly view of tasks |
| `pages/TodayPlan.jsx` | Daily recommended tasks |
| `pages/EmailSync.jsx` | Microsoft OAuth email sync |
| `components/TaskForm.jsx` | Form to create/edit tasks |
| `components/TaskList.jsx` | Displays list of tasks |
| `components/TaskItem.jsx` | Single task display with actions |
| `components/NotificationBell.jsx` | Notification dropdown in navbar |
| `components/AIAssistant.jsx` | Chatbot for task help and insights |

### Docker Files

| File | Description |
|------|-------------|
| `docker-compose.yml` | Defines 3 containers: PostgreSQL, backend, frontend |
| `backend/Dockerfile` | Builds Node.js backend image |
| `frontend/Dockerfile` | Builds React frontend image |
| `.env.docker` | Template for Docker environment variables |

## Database Schema

### Tables

```sql
-- Users table
users (id, email, password_hash, name, created_at, updated_at)

-- Courses table
courses (id, user_id, name, code, color, instructor, created_at)

-- Tags table
tags (id, user_id, name, color, created_at)

-- Tasks table
tasks (id, user_id, course_id, title, description, due_date, 
       duration, priority, is_completed, created_at, updated_at)

-- Task-Tags junction table
task_tags (task_id, tag_id)

-- Notifications table
notifications (id, user_id, task_id, type, title, message, 
              is_read, created_at)

-- Email sources table
email_sources (id, user_id, provider, host, port, tls, username,
               password_encrypted, access_token, refresh_token,
               oauth_token, expires_at, last_sync_at, enabled, created_at)
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all user tasks |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all user courses |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations/today` | Get prioritized tasks |
| GET | `/api/recommendations/workload` | Get workload distribution |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Microsoft OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/microsoft/auth-url` | Get OAuth URL for Microsoft login |
| POST | `/api/microsoft/token` | Exchange auth code for tokens and connect account |
| GET | `/api/microsoft/status` | Check whether account is connected |
| POST | `/api/microsoft/disconnect` | Disconnect Microsoft account |

### Email Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/email_sources` | Get saved email sources |
| POST | `/api/email_sources` | Create or upsert email source |
| PUT | `/api/email_sources/:id` | Update email source |
| DELETE | `/api/email_sources/:id` | Delete email source |

### Email Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/now` | Trigger sync job immediately |
| GET | `/api/email/status` | Get sync status and source info |

## Dependencies

### Backend Dependencies
```json
{
  "axios": "^1.13.5",           // HTTP client for Microsoft APIs
  "bcrypt": "^5.1.1",           // Password hashing
  "chrono-node": "^2.9.0",      // Natural language date parsing
  "cookie-parser": "^1.4.6",    // Cookie parsing
  "cors": "^2.8.5",             // Cross-origin requests
  "dotenv": "^16.3.1",          // Environment variables
  "express": "^4.18.2",         // Web framework
  "imapflow": "^1.2.10",        // IMAP integration helpers
  "jsonwebtoken": "^9.0.2",     // JWT authentication
  "mailparser": "^3.9.3",       // Email parsing helpers
  "node-cron": "^3.0.3",        // Scheduled jobs
  "pg": "^8.11.3"               // PostgreSQL client
}
```

### Backend Dev Dependencies
```json
{
  "nodemon": "^3.0.2"           // Auto-restart server
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",           // React library
  "react-dom": "^18.2.0",       // React DOM
  "react-router-dom": "^6.20.1", // Routing
  "react-scripts": "5.0.1"      // React scripts
}
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL 15 or 16
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Planora
```

### 2. Install PostgreSQL (macOS, example with v16)

```bash
# Install via Homebrew
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Add to PATH (add to ~/.zshrc for persistence)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

### 3. Create Database

```bash
# Create database
createdb planora

# Run schema
psql -d planora -f backend/db/schema.sql
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Configure Environment Variables

Create `.env` file in `backend/` folder:

```env
PORT=5001
DATABASE_URL=postgresql://localhost:5432/planora
JWT_SECRET=your_super_secure_jwt_secret_change_in_production
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# Optional: required only for Microsoft OAuth email sync
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
```

### 6. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 7. (Optional) Frontend Environment Variable

Create `frontend/.env` if you want a custom API URL:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

### 8. (Optional) Microsoft OAuth Setup

If you want email sync enabled:

1. Register an app in Azure Portal
2. Add redirect URI: `http://localhost:3000`
3. Grant delegated scopes: `Mail.Read` and `offline_access`
4. Copy credentials into `backend/.env` (`MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`)

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5001`

### Start Frontend Server

Open a new terminal:

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### Access the Application

Open your browser and go to: `http://localhost:3000`

## Running with Docker (Recommended)

Docker ensures the app works consistently across all platforms (Windows, macOS, Linux).
The current `docker-compose.yml` provisions PostgreSQL 15, backend on `5001`, and frontend on `3000`.

### 1. Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop

### 2. Configure Environment Variables

```bash
# Copy the template
cp .env.docker .env

# Edit .env with your Microsoft OAuth credentials (optional for basic use)
```

### 3. Run the Application

```bash
# Build and start all containers
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- PostgreSQL: localhost:5432

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up --build` | Build and start all services |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop and remove data |
| `docker-compose logs -f` | View logs |
| `docker-compose restart` | Restart all services |

### Troubleshooting Docker

```bash
# View running containers
docker ps

# View logs for specific service
docker-compose logs -f backend

# Rebuild after code changes
docker-compose up --build
```

## Recommendation Engine Algorithm

Tasks are scored using the formula:

```
score = priority_weight × urgency_weight × duration_factor
```

### Priority Weights
| Priority | Weight |
|----------|--------|
| High | 3.0 |
| Medium | 2.0 |
| Low | 1.0 |

### Urgency Weights
| Time Until Due | Weight |
|----------------|--------|
| Overdue | 4.0 |
| < 6 hours | 3.5 |
| < 24 hours | 3.0 |
| < 2 days | 2.5 |
| < 3 days | 2.0 |
| < 5 days | 1.5 |
| < 7 days | 1.0 |
| > 7 days | 0.7 |

### Duration Factors
| Duration | Factor |
|----------|--------|
| ≤ 30 min | 1.3 |
| ≤ 60 min | 1.2 |
| ≤ 90 min | 1.0 |
| ≤ 120 min | 0.9 |
| > 120 min | 0.8 |

## Notification System

The notification system runs every 15 minutes and:

1. Checks for tasks due within 24 hours
2. Creates reminder notifications for upcoming deadlines
3. Creates overdue notifications for missed deadlines
4. Prevents duplicate notifications with a 12-hour cooldown

## Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens stored in httpOnly cookies
- CSRF protection via sameSite cookies
- User-scoped database queries (users can only access their own data)
- Input validation on all endpoints

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://localhost:5432/planora` |
| `JWT_SECRET` | Secret for JWT signing | (required) |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGINS` | Extra allowed CORS origins (comma-separated) | empty |
| `FRONTEND_URL` | Production frontend URL for CORS | empty |
| `MICROSOFT_CLIENT_ID` | Microsoft app client ID | empty |
| `MICROSOFT_CLIENT_SECRET` | Microsoft app client secret | empty |
| `MICROSOFT_TENANT_ID` | Microsoft tenant ID (`common` if omitted) | empty |

### Frontend (`frontend/.env`, optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Base API URL used by frontend | `http://localhost:5001/api` |

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
brew services list

# Restart PostgreSQL
brew services restart postgresql@16
```

### Cannot Connect to Server

1. Ensure backend is running on port 5001
2. Check if PostgreSQL is running
3. Verify database exists: `psql -l | grep planora`

## License

MIT License

## Authors

Developed as a Software Engineering project at Saint Louis University.
