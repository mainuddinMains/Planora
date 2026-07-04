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

  const metrics = [
    { value: stats.overdue, label: t('statOverdue'), warn: stats.overdue > 0 },
    { value: stats.dueToday, label: t('statDueToday') },
    { value: stats.highOpen, label: t('statHighPriority') },
    { value: stats.completedWeek, label: t('statCompletedWeek') },
  ];

  return (
    <div className="metric-ribbon" role="region" aria-label={t('dashboardStatsAria')}>
      {metrics.map((m, i) => (
        <React.Fragment key={m.label}>
          {i > 0 && <span className="metric-divider" aria-hidden="true" />}
          <span className={`metric-item${m.warn ? ' metric-item--warn' : ''}`}>
            <span className="metric-value">{m.value}</span>
            <span className="metric-label">{m.label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default DashboardStats;
