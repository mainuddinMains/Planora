import React from 'react';
import { useWeeklyTasks } from '../hooks';
import { useLanguage } from '../hooks/useLanguage';

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
    currentWeekStart
  } = useWeeklyTasks();

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
    return <div className="page">Loading calendar...</div>;
  }

  if (error) {
    return <div className="page error-message">{error}</div>;
  }

  return (
    <div className="page weekly-calendar">
      <div className="calendar-header">
        <h1>Weekly Calendar</h1>
        <div className="week-navigation">
          <button onClick={goToPreviousWeek} className="btn-secondary">
            Previous
          </button>
          <button onClick={goToCurrentWeek} className="btn-secondary">
            Today
          </button>
          <button onClick={goToNextWeek} className="btn-secondary">
            Next
          </button>
        </div>
      </div>

      <div className="week-info">
        <h2>{formatWeekRange()}</h2>
        <div className="week-stats">
          <span className="stat">{getTaskCount()} tasks</span>
          <span className="stat">{Math.round(getTotalDuration() / 60)}h workload</span>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDays.map((day, index) => {
          const dayTasks = tasksByDay[day.toDateString()] || [];
          const isToday = day.toDateString() === new Date().toDateString();
          const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

          return (
            <div key={index} className={`calendar-day ${isToday ? 'today' : ''}`}>
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
                  <div className="no-tasks">No tasks</div>
                ) : (
                  dayTasks.map(task => (
                    <div
                      key={task.id}
                      className={`calendar-task ${task.is_completed ? 'completed' : ''}`}
                      style={{ borderLeftColor: task.course_color || '#4a90a4' }}
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
  );
}

export default WeeklyCalendar;
