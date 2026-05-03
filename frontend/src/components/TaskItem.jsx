import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

function TaskItem({
  task,
  onToggle = () => {},
  onEdit = () => {},
  onDelete = () => {},
  density = 'comfortable',
  readOnly = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}) {
  const { t } = useLanguage();
  
  // Helper to trigger the download of the Base64 attachment
  const handleDownload = (e) => {
    e.stopPropagation(); // Prevent triggering any parent click events
    if (!task.attachment_data) return;

    const link = document.createElement('a');
    link.href = task.attachment_data;
    // Use the original filename or default to 'attachment'
    link.download = task.attachment_name || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `${t('dueToday')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `${t('dueTomorrow')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed;

  return (
    <div
      className={`task-item ${task.is_completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${
        density === 'compact' ? 'task-item--compact' : ''
      }`}
      draggable={draggable && !task.is_completed}
      onDragStart={draggable ? (e) => onDragStart?.(e, task) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {!readOnly && (
        <div className="task-checkbox">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={() => onToggle(task.id, !task.is_completed)}
          />
        </div>
      )}

      <div className="task-content">
        <div className="task-header">
          <div className="task-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 className="task-title">{task.title}</h4>
            
            {/* Show attachment icon if data exists */}
            {task.attachment_data && (
              <button 
                onClick={handleDownload} 
                className="btn-icon attachment-btn" 
                title={`${t('download')} ${task.attachment_name || ''}`}
                style={{ fontSize: '1.1rem', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                📎
              </button>
            )}
          </div>
          
          <span className={`task-priority ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        {task.description && density !== 'compact' && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-meta">
          {task.course_name && (
            <span className="task-course" style={{ backgroundColor: task.course_color || '#4a90a4' }}>
              {task.course_name}
            </span>
          )}
          {task.due_date && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              {formatDate(task.due_date)}
            </span>
          )}
          {task.duration && (
            <span className="task-duration">{task.duration} {t('minutes')}</span>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="task-actions">
          <button onClick={() => onEdit(task)} className="btn-icon" title={t('edit')}>
            ✏️
          </button>
          <button onClick={() => onDelete(task.id)} className="btn-icon" title={t('delete')}>
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskItem;