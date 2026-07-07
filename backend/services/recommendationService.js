const db = require('../db');

const PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1
};

function calculateUrgencyWeight(dueDate) {
  if (!dueDate) return 0.5;

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffMs < 0) {
    return 4.0;
  }
  if (diffHours <= 6) {
    return 3.5;
  }
  if (diffHours <= 24) {
    return 3.0;
  }
  if (diffDays <= 2) {
    return 2.5;
  }
  if (diffDays <= 3) {
    return 2.0;
  }
  if (diffDays <= 5) {
    return 1.5;
  }
  if (diffDays <= 7) {
    return 1.0;
  }
  return 0.7;
}

function calculateDurationFactor(duration) {
  if (!duration || duration <= 0) return 1.0;
  
  if (duration <= 30) return 1.3;
  if (duration <= 60) return 1.2;
  if (duration <= 90) return 1.0;
  if (duration <= 120) return 0.9;
  return 0.8;
}

function calculateTaskScore(task) {
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] || 1;
  const urgencyWeight = calculateUrgencyWeight(task.due_date);
  const durationFactor = calculateDurationFactor(task.duration);

  return priorityWeight * urgencyWeight * durationFactor;
}

async function getTodayRecommendations(userId, limit = 10) {
  const result = await db.query(
    `SELECT t.*, c.name as course_name, c.color as course_color
     FROM tasks t
     LEFT JOIN courses c ON t.course_id = c.id
     WHERE t.user_id = $1 AND t.is_completed = FALSE
     ORDER BY t.due_date ASC NULLS LAST`,
    [userId]
  );

  const tasks = result.rows.map(task => ({
    ...task,
    score: calculateTaskScore(task)
  }));

  tasks.sort((a, b) => b.score - a.score);

  return tasks.slice(0, limit);
}

async function getWorkloadDistribution(userId, startDate, endDate) {
  const result = await db.query(
    `SELECT
       DATE(t.due_date) as date,
       COUNT(*) as task_count,
       SUM(t.duration) as total_duration,
       array_agg(json_build_object(
         'id', t.id,
         'title', t.title,
         'duration', t.duration,
         'priority', t.priority,
         'course_name', c.name
       )) as tasks
     FROM tasks t
     LEFT JOIN courses c ON c.id = t.course_id
     WHERE t.user_id = $1
       AND t.is_completed = FALSE
       AND t.due_date BETWEEN $2 AND $3
     GROUP BY DATE(t.due_date)
     ORDER BY date`,
    [userId, startDate, endDate]
  );

  return result.rows;
}

async function getWeeklyTasks(userId) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const result = await db.query(
    `SELECT t.*, c.name as course_name, c.color as course_color
     FROM tasks t
     LEFT JOIN courses c ON t.course_id = c.id
     WHERE t.user_id = $1 
       AND t.due_date BETWEEN $2 AND $3
     ORDER BY t.due_date ASC`,
    [userId, startOfWeek, endOfWeek]
  );

  return result.rows;
}

module.exports = {
  calculateTaskScore,
  getTodayRecommendations,
  getWorkloadDistribution,
  getWeeklyTasks
};
