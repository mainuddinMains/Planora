import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { getTasks, updateTask } from '../api';
import { MiniTaskList } from "../components";

function MonthlyCalendar() {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [isUnscheduleDragOver, setIsUnscheduleDragOver] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks({});
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoading(false);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getTasksForDay = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const handleDragStart = (e, task, date) => {
    const fallbackDate = date instanceof Date ? date : null;
    setDraggedTask({
      task,
      originalDueDate: task.due_date || (fallbackDate ? fallbackDate.toISOString() : null),
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    setDragOverDay(date);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    setDragOverDay(null);
    setIsUnscheduleDragOver(false);
    
    if (!draggedTask) return;
    
    const originalDate = draggedTask.originalDueDate
      ? new Date(draggedTask.originalDueDate)
      : null;
    const newDate = new Date(targetDate);
    const hours = originalDate ? originalDate.getHours() : 9;
    const minutes = originalDate ? originalDate.getMinutes() : 0;
    newDate.setHours(hours, minutes, 0, 0);
    
    if (originalDate && newDate.toDateString() === originalDate.toDateString()) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask.task.id, { due_date: newDate.toISOString() });
      setMessage(t('taskUpdated'));
      setTimeout(() => setMessage(''), 3000);
      fetchTasks();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
    
    setDraggedTask(null);
  };

  const handleUnscheduleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsUnscheduleDragOver(true);
  };

  const handleUnscheduleDragLeave = () => {
    setIsUnscheduleDragOver(false);
  };

  const handleUnscheduleDrop = async (e) => {
    e.preventDefault();
    setDragOverDay(null);
    setIsUnscheduleDragOver(false);

    if (!draggedTask) return;
    if (!draggedTask.task?.due_date) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask.task.id, { due_date: null });
      setMessage('Task unscheduled');
      setTimeout(() => setMessage(''), 3000);
      fetchTasks();
    } catch (err) {
      console.error('Failed to unschedule task:', err);
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDay(null);
    setIsUnscheduleDragOver(false);
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return <div className="page">{t('loadingCalendar')}</div>;
  }

  return (
    <div className="page monthly-calendar">
      <div className="calendar-header">
        <h1>{t('monthlyOverview') || 'Monthly Overview'}</h1>
        <div className="month-navigation">
          <button onClick={goToPreviousMonth} className="btn-secondary">
            ◀
          </button>
          <button onClick={goToCurrentMonth} className="btn-secondary">
            {t('today') || 'Today'}
          </button>
          <button onClick={goToNextMonth} className="btn-secondary">
            ▶
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main-column">
          {message && <div className="success-message">{message}</div>}

          <div className="month-info">
            <h2>{formatMonthYear()}</h2>
          </div>

          <div className="month-grid">
            {weekDays.map(day => (
              <div key={day} className="month-weekday">{day}</div>
            ))}

            {getMonthDays().map((dayInfo, index) => {
              const dayTasks = getTasksForDay(dayInfo.date);
              const isCurrentDay = isToday(dayInfo.date);

              return (
                <div
                  key={index}
                  className={`month-day ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''} ${dragOverDay?.toDateString() === dayInfo.date.toDateString() ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, dayInfo.date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayInfo.date)}
                >
                  <div className="day-header">
                    <span className="day-number">{dayInfo.date.getDate()}</span>
                    {dayTasks.length > 0 && (
                      <span className="task-count">{dayTasks.length}</span>
                    )}
                  </div>

                  <div className="day-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={`month-task ${task.is_completed ? 'completed' : ''} ${draggedTask?.task.id === task.id ? 'dragging' : ''}`}
                        style={{ borderLeftColor: task.course_color || '#4a90a4' }}
                        draggable={!task.is_completed}
                        onDragStart={(e) => handleDragStart(e, task, dayInfo.date)}
                        onDragEnd={handleDragEnd}
                        title={task.title}
                      >
                        <span className="task-dot">•</span>
                        <span className="task-name">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="more-tasks">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="calendar-side-column">
          <section className="focus-panel" aria-labelledby="monthly-side-tasks-title">
            <h2 id="monthly-side-tasks-title" className="focus-panel-title">
              Unscheduled Tasks
            </h2>
            <p className="focus-panel-hint">Drag these tasks over to a day to set a due date.</p>
            <div
              className={`unschedule-drop-zone ${isUnscheduleDragOver ? 'drag-over' : ''}`}
              onDragOver={handleUnscheduleDragOver}
              onDragLeave={handleUnscheduleDragLeave}
              onDrop={handleUnscheduleDrop}
            >
              Drag here to remove a due date
            </div>
            <MiniTaskList
              tasks={tasks.filter(task => !task.due_date)}
              limit={5}
              prioritize
              readOnly
              density="compact"
              emptyMessageKey="noTasks"
              className="focus-panel-inner-list"
              emptyClassName="focus-panel-empty"
              draggable
              onTaskDragStart={handleDragStart}
              onTaskDragEnd={handleDragEnd}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default MonthlyCalendar;
