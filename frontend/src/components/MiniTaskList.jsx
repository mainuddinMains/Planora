import React, { useMemo } from 'react';
import TaskItem from './TaskItem';
import { useLanguage } from '../hooks/useLanguage';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const NOOP = () => {};

function rankFocusTasks(tasks, limit) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const openTasks = tasks.filter((task) => !task.is_completed);

  return [...openTasks]
    .sort((a, b) => {
      const dueA = a.due_date ? new Date(a.due_date) : null;
      const dueB = b.due_date ? new Date(b.due_date) : null;
      const overdueA = dueA && dueA < now;
      const overdueB = dueB && dueB < now;
      if (overdueA !== overdueB) return overdueA ? -1 : 1;

      const todayA = dueA && dueA >= todayStart && dueA <= todayEnd && !overdueA;
      const todayB = dueB && dueB >= todayStart && dueB <= todayEnd && !overdueB;
      if (todayA !== todayB) return todayA ? -1 : 1;

      if (dueA && dueB) return dueA - dueB;
      if (dueA) return -1;
      if (dueB) return 1;

      const priorityA = PRIORITY_ORDER[a.priority] ?? 1;
      const priorityB = PRIORITY_ORDER[b.priority] ?? 1;
      return priorityA - priorityB;
    })
    .slice(0, limit);
}

function MiniTaskList({
  tasks = [],
  onToggle,
  onEdit,
  onDelete,
  onReschedule,
  limit,
  prioritize = true,
  readOnly = false,
  density = 'compact',
  emptyMessageKey = 'focusEmpty',
  className = '',
  emptyClassName = '',
  draggable = false,
  onTaskDragStart,
  onTaskDragEnd,
}) {
  const { t } = useLanguage();

  const visibleTasks = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];
    if (!prioritize) return tasks.slice(0, limit);
    return rankFocusTasks(tasks, limit);
  }, [tasks, prioritize, limit]);

  const listClassName = `task-list ${density === 'compact' ? 'task-list--compact' : ''} ${className}`.trim();
  const emptyStateClassName = `empty-state ${emptyClassName}`.trim();

  return (
    <div className={listClassName}>
      {visibleTasks.length === 0 ? (
        <div className={emptyStateClassName}>{t(emptyMessageKey)}</div>
      ) : (
        visibleTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle || NOOP}
            onEdit={onEdit || NOOP}
            onDelete={onDelete || NOOP}
            onReschedule={onReschedule}
            density={density}
            readOnly={readOnly}
            draggable={draggable}
            onDragStart={onTaskDragStart}
            onDragEnd={onTaskDragEnd}
          />
        ))
      )}
    </div>
  );
}

export default MiniTaskList;
