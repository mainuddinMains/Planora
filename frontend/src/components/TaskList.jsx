import React, { useState } from 'react';
import TaskItem from './TaskItem';
import { useLanguage } from '../hooks/useLanguage';

function TaskList({ tasks, onToggle, onEdit, onDelete }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (task.course_name && task.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const completedCount = tasks.filter(t => t.is_completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="task-stats">
          <span className="stat">{pendingCount} {t('pending')}</span>
          <span className="stat">{completedCount} {t('completed')}</span>
        </div>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? t('noTasksMatch') : t('noTasks')}
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;
