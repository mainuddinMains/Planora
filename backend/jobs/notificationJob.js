const cron = require('node-cron');
const db = require('../db');

const REMINDER_WINDOW_HOURS = 24;
const NOTIFICATION_COOLDOWN_HOURS = 12;

async function checkUpcomingDeadlines() {
  console.log('[NotificationJob] Checking for upcoming deadlines...');

  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);
    const cooldownWindow = new Date(now.getTime() - NOTIFICATION_COOLDOWN_HOURS * 60 * 60 * 1000);

    const tasksResult = await db.query(
      `SELECT t.id, t.title, t.due_date, t.user_id, c.name as course_name
       FROM tasks t
       LEFT JOIN courses c ON t.course_id = c.id
       WHERE t.is_completed = FALSE
         AND t.due_date IS NOT NULL
         AND t.due_date > NOW()
         AND t.due_date <= $1`,
      [reminderWindow]
    );

    const tasks = tasksResult.rows;
    console.log(`[NotificationJob] Found ${tasks.length} upcoming tasks`);

    if (tasks.length === 0) return;

    const taskIds = tasks.map(t => t.id);
    const existingResult = await db.query(
      `SELECT task_id FROM notifications
       WHERE task_id = ANY($1::int[]) AND created_at > $2`,
      [taskIds, cooldownWindow]
    );
    const notifiedTaskIds = new Set(existingResult.rows.map(r => r.task_id));

    const inserts = [];
    for (const task of tasks) {
      if (notifiedTaskIds.has(task.id)) continue;

      const dueDate = new Date(task.due_date);
      const hoursUntilDue = Math.round((dueDate - now) / (1000 * 60 * 60));

      let urgencyText;
      if (hoursUntilDue <= 1) {
        urgencyText = 'due in less than an hour';
      } else if (hoursUntilDue <= 6) {
        urgencyText = `due in ${hoursUntilDue} hours`;
      } else {
        urgencyText = `due in ${hoursUntilDue} hours (${dueDate.toLocaleDateString()})`;
      }

      const title = `Task Reminder: ${task.title}`;
      const message = `"${task.title}" is ${urgencyText}.${task.course_name ? ` Course: ${task.course_name}` : ''}`;
      inserts.push({ userId: task.user_id, taskId: task.id, title, message });
    }

    for (const n of inserts) {
      await db.query(
        `INSERT INTO notifications (user_id, task_id, type, title, message)
         VALUES ($1, $2, 'reminder', $3, $4)`,
        [n.userId, n.taskId, n.title, n.message]
      );
      console.log(`[NotificationJob] Created notification for task id=${n.taskId} (user: ${n.userId})`);
    }

    console.log('[NotificationJob] Notification check complete');
  } catch (error) {
    console.error('[NotificationJob] Error checking deadlines:', error);
  }
}

async function checkOverdueTasks() {
  console.log('[NotificationJob] Checking for overdue tasks...');

  try {
    const now = new Date();
    const recentWindow = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const overdueResult = await db.query(
      `SELECT t.id, t.title, t.due_date, t.user_id, c.name as course_name
       FROM tasks t
       LEFT JOIN courses c ON t.course_id = c.id
       WHERE t.is_completed = FALSE
         AND t.due_date IS NOT NULL
         AND t.due_date < NOW()
         AND t.due_date >= $1`,
      [recentWindow]
    );

    const tasks = overdueResult.rows;
    console.log(`[NotificationJob] Found ${tasks.length} recently overdue tasks`);

    if (tasks.length === 0) return;

    const taskIds = tasks.map(t => t.id);
    const existingResult = await db.query(
      `SELECT task_id FROM notifications
       WHERE task_id = ANY($1::int[]) AND type = 'overdue'`,
      [taskIds]
    );
    const notifiedTaskIds = new Set(existingResult.rows.map(r => r.task_id));

    for (const task of tasks) {
      if (notifiedTaskIds.has(task.id)) continue;

      const title = `Overdue: ${task.title}`;
      const message = `"${task.title}" is now overdue. It was due on ${new Date(task.due_date).toLocaleString()}.${task.course_name ? ` Course: ${task.course_name}` : ''}`;

      await db.query(
        `INSERT INTO notifications (user_id, task_id, type, title, message)
         VALUES ($1, $2, 'overdue', $3, $4)`,
        [task.user_id, task.id, title, message]
      );

      console.log(`[NotificationJob] Created overdue notification for task id=${task.id}`);
    }
  } catch (error) {
    console.error('[NotificationJob] Error checking overdue tasks:', error);
  }
}

function startNotificationJobs() {
  console.log('[NotificationJob] Starting notification cron jobs...');

  cron.schedule('*/15 * * * *', () => {
    checkUpcomingDeadlines();
    checkOverdueTasks();
  });

  console.log('[NotificationJob] Notification jobs scheduled (every 15 minutes)');
}

module.exports = {
  startNotificationJobs,
  checkUpcomingDeadlines,
  checkOverdueTasks
};
