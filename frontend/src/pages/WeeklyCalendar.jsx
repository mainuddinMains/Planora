import React, { useState } from 'react';
import { useWeeklyTasks } from '../hooks';
import { useLanguage } from '../hooks/useLanguage';
import { updateTask } from '../api';
import { MiniTaskList } from "../components";

function WeeklyCalendar() {
  const { t } = useLanguage();
  const {
    tasksByDay,
    weekDays,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    currentWeekStart,
    refresh
  } = useWeeklyTasks();
  
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [message, setMessage] = useState('');

  const handleDragStart = (e, task, day) => {
    setDraggedTask({ task, originalDay: day });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id }));
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedTask || !targetDay) return;
    
    const originalDate = new Date(draggedTask.originalDay);
    const targetDate = new Date(targetDay);
    
    const hours = originalDate.getHours();
    const minutes = originalDate.getMinutes();
    targetDate.setHours(hours, minutes, 0, 0);
    
    if (targetDate.toDateString() === originalDate.toDateString()) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask.task.id, {
        due_date: targetDate.toISOString()
      });
      setMessage(t('taskUpdated'));
      setTimeout(() => setMessage(''), 3000);
      refresh();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDay(null);
  };

  const formatDayHeader = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return (
      <div className={`day-header ${isToday ? 'today' : ''}`}>
        <span className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span className="day-number">{date.getDate()}</span>
      </div>
    );
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const getTaskCount = () => {
    return Object.values(tasksByDay).flat().length;
  };

  const getTotalDuration = () => {
    let total = 0;
    Object.values(tasksByDay).forEach(dayTasks => {
      dayTasks.forEach(task => {
        total += task.duration || 0;
      });
    });
    return total;
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="page">{t('loadingCalendar')}</div>;
  }

  if (error) {
    return <div className="page error-message">{error}</div>;
  }

  return (
    <div className="page weekly-calendar">
      <div className="calendar-header">
        <h1>{t('weeklyOverview')}</h1>
        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="btn-secondary">
            {t('previousWeek')}
          </button>
          <button onClick={goToCurrentWeek} className="btn-secondary">
            {t('thisWeek')}
          </button>
          <button onClick={goToNextWeek} className="btn-secondary">
            {t('nextWeek')}
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main-column">
          <div className="week-info">
            <h2>{formatWeekRange()}</h2>
            <div className="week-stats">
              <span className="stat">{getTaskCount()} {t('tasks')}</span>
              <span className="stat">{Math.round(getTotalDuration() / 60)}{t('hours')}</span>
            </div>
          </div>

          {message && (
            <div className="success-message">{message}</div>
          )}

          <div className="calendar-grid">
            {weekDays.map((day, index) => {
              const dayTasks = tasksByDay[day.toDateString()] || [];
              const isToday = day.toDateString() === new Date().toDateString();
              const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

              return (
                <div
                  key={index}
                  className={`calendar-day ${isToday ? 'today' : ''} ${dragOverDay?.toDateString() === day.toDateString() ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  {formatDayHeader(day)}

                  <div className="day-workload">
                    {totalMinutes > 0 && (
                      <span className="workload-badge">
                        {totalMinutes >= 60
                          ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`
                          : `${totalMinutes}m`
                        }
                      </span>
                    )}
                  </div>

                  <div className="day-tasks">
                    {dayTasks.length === 0 ? (
                      <div className="no-tasks">{t('noTasks')}</div>
                    ) : (
                      dayTasks.map(task => (
                        <div
                          key={task.id}
                          className={`calendar-task ${task.is_completed ? 'completed' : ''} ${draggedTask?.task.id === task.id ? 'dragging' : ''}`}
                          style={{ borderLeftColor: task.course_color || '#4a90a4' }}
                          draggable={!task.is_completed}
                          onDragStart={(e) => handleDragStart(e, task, day)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="task-time">{formatTime(task.due_date)}</div>
                          <div className="task-title">{task.title}</div>
                          <div className="task-badges">
                            <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.duration && (
                              <span className="task-duration">{task.duration}m</span>
                            )}
                          </div>
                          {task.course_name && (
                            <div className="task-course">{task.course_name}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="calendar-side-column">
          <section className="focus-panel" aria-labelledby="weekly-side-tasks-title">
            <h2 id="weekly-side-tasks-title" className="focus-panel-title">
              Top Tasks
            </h2>
            <p className="focus-panel-hint">Drag these tasks over to a day to set a due date.</p>
            <MiniTaskList
              tasks={Object.values(tasksByDay).flat()}
              limit={5}
              prioritize
              readOnly
              density="compact"
              emptyMessageKey="noTasks"
              className="focus-panel-inner-list"
              emptyClassName="focus-panel-empty"
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default WeeklyCalendar;
