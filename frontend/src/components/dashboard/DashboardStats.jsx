import React, { useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function DashboardStats({ tasks = [] }) {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const ws = startOfWeek(now);
    const we = endOfWeek(now);

    let overdue = 0;
    let dueToday = 0;
    let highOpen = 0;
    let completedWeek = 0;

    tasks.forEach((task) => {
      if (task.is_completed) {
        if (task.updated_at) {
          const u = new Date(task.updated_at);
          if (u >= ws && u <= we) completedWeek += 1;
        }
        return;
      }
      if (task.priority === 'high') highOpen += 1;
      if (!task.due_date) return;
      const due = new Date(task.due_date);
      if (due < todayStart) {
        overdue += 1;
        return;
      }
      if (due >= todayStart && due <= todayEnd) dueToday += 1;
    });

    return { overdue, dueToday, highOpen, completedWeek };
  }, [tasks]);

  const cards = [
    { value: stats.overdue, label: t('statOverdue'), warn: stats.overdue > 0 },
    { value: stats.dueToday, label: t('statDueToday') },
    { value: stats.highOpen, label: t('statHighPriority') },
    { value: stats.completedWeek, label: t('statCompletedWeek') },
  ];

  return (
    <div className="dashboard-stats" role="region" aria-label={t('dashboardStatsAria')}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={`dashboard-stat-card ${c.warn ? 'dashboard-stat-card--warn' : ''}`}
        >
          <span className="dashboard-stat-value">{c.value}</span>
          <span className="dashboard-stat-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
