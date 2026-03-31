import React, { useMemo } from 'react';
import TaskItem from '../TaskItem';
import { useLanguage } from '../../hooks/useLanguage';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function rankFocusTasks(tasks, limit = 5) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const open = tasks.filter((t) => !t.is_completed);

  return [...open]
    .sort((a, b) => {
      const da = a.due_date ? new Date(a.due_date) : null;
      const db = b.due_date ? new Date(b.due_date) : null;
      const aOver = da && da < now;
      const bOver = db && db < now;
      if (aOver !== bOver) return aOver ? -1 : 1;
      const aToday =
        da && da >= todayStart && da <= todayEnd && !aOver;
      const bToday =
        db && db >= todayStart && db <= todayEnd && !bOver;
      if (aToday !== bToday) return aToday ? -1 : 1;
      if (da && db) return da - db;
      if (da) return -1;
      if (db) return 1;
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      return pa - pb;
    })
    .slice(0, limit);
}

function FocusTasks({ tasks = [], onToggle, onEdit, onDelete, limit = 5 }) {
  const { t } = useLanguage();
  const focusList = useMemo(() => rankFocusTasks(tasks, limit), [tasks, limit]);

  return (
    <section className="focus-panel" aria-labelledby="focus-panel-title">
      <h2 id="focus-panel-title" className="focus-panel-title">
        {t('focusNextTasks')}
      </h2>
      <p className="focus-panel-hint">{t('focusNextTasksHint')}</p>
      {focusList.length === 0 ? (
        <div className="focus-panel-empty empty-state">{t('focusEmpty')}</div>
      ) : (
        <div className="focus-panel-list">
          <div className="task-list focus-panel-inner-list">
            {focusList.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                density="compact"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default FocusTasks;
