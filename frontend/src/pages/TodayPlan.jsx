import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { useLanguage } from '../hooks/useLanguage';
import {
  formatDueDate,
  getTodayRecommendations,
  updateTask,
  TaskListSortMethod,
  sortedTaskList,
  groupedTaskLists, TaskListGroupMethod
} from '../api'

function TodayPlan() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [sortBy, setSortBy] = useState(TaskListSortMethod.PRIORITY);
  const [sortDescending, setSortDescending] = useState(true);
  const [groupBy, setGroupBy] = useState(TaskListGroupMethod.COMPLETED);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodayRecommendations(15);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId, isCompleted) => {
    try {
      await updateTask(taskId, { is_completed: isCompleted });
      setRecommendations(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, is_completed: isCompleted } : task
        )
      );
      setMessage(isCompleted ? 'Task completed! Great job!' : 'Task marked as incomplete');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to update task: ' + err.message);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getScoreLabel = (score) => {
    if (score >= 12) return 'Critical';
    if (score >= 8) return 'High Priority';
    if (score >= 5) return 'Medium Priority';
    return 'Low Priority';
  };

  const getTotalDuration = () => {
    return recommendations
      .filter(t => !t.is_completed)
      .reduce((sum, t) => sum + (t.duration || 0), 0);
  };

  const completedCount = recommendations.filter(t => t.is_completed).length;
  const pendingCount = recommendations.filter(t => !t.is_completed).length;

  if (loading) {
    return <div className="page">{t('generatingPlan')}</div>;
  }

  return (
    <div className="page today-plan">
      <div className="plan-header">
        <div>
          <h1>{t('todaysPlan')}</h1>
          <p>{t('welcome')}, {user?.name || 'Student'}, here's your prioritized task list</p>
        </div>
        <button onClick={fetchRecommendations} className="btn-secondary">
          {t('refresh') || 'Refresh'}
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="plan-stats">
        <div className="stat-card">
          <span className="stat-value">{pendingCount}</span>
          <span className="stat-label">{t('tasksPending')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{completedCount}</span>
          <span className="stat-label">{t('completedToday')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {getTotalDuration() >= 60
              ? `${Math.round(getTotalDuration() / 60)}h ${getTotalDuration() % 60}m`
              : `${getTotalDuration()}m`
            }
          </span>
          <span className="stat-label">Estimated Time</span>
        </div>
      </div>

      <div className="recommendations-list">
        <h2>{t('recommendedTaskOrder') || 'Recommended Task Order'}</h2>
        <p className="recommendation-info">
          {t('tasksRanked')}
        </p>

        <div className="task-list-controls">
          <label htmlFor="sort-select">{(t('sortBy') || 'Sort by') + ' '}</label>
          <select id="sort-select" onChange={(e) => setSortBy(e.target.value)} defaultValue={TaskListSortMethod.PRIORITY.name}>
            <option value={TaskListSortMethod.PRIORITY.name}>{(t(TaskListSortMethod.PRIORITY.name) || TaskListSortMethod.PRIORITY.name).toLowerCase()}</option>
            <option value={TaskListSortMethod.DATE.name}>{(t(TaskListSortMethod.DATE.name) || TaskListSortMethod.DATE.name).toLowerCase()}</option>
            <option value={TaskListSortMethod.DURATION.name}>{(t(TaskListSortMethod.DURATION.name) || TaskListSortMethod.DURATION.name).toLowerCase()}</option>
            <option value={TaskListSortMethod.TITLE.name}>{(t(TaskListSortMethod.TITLE.name) || TaskListSortMethod.TITLE.name).toLowerCase()}</option>
          </select>
          <button
          type="button"
          className="btn-secondary"
          onClick={() => {setSortDescending(!sortDescending)}}
          aria-label={sortDescending ? "Switch to ascending sort" : "Switch to descending sort"}
          title={sortDescending ? "Descending" : "Ascending"}
          style={{"padding": "0.25rem 1rem", "marginLeft": "1rem",}}
          >
            {sortDescending ? "↓" : "↑"}
          </button>
        </div>

        <div className="task-list-controls">
          <label htmlFor="group-select">{(t('groupBy') || 'Group by') + ' '}</label>
          <select id="group-select" onChange={(e) => setGroupBy(e.target.value)} defaultValue={TaskListGroupMethod.COMPLETED.name}>
            <option value={TaskListGroupMethod.COMPLETED.name}>{(t(TaskListGroupMethod.COMPLETED.name) || TaskListGroupMethod.COMPLETED.name).toLowerCase()}</option>
            <option value={TaskListGroupMethod.PRIORITY.name}>{(t(TaskListGroupMethod.PRIORITY.name) || TaskListGroupMethod.PRIORITY.name).toLowerCase()}</option>
            <option value={TaskListGroupMethod.COURSE.name}>{(t(TaskListGroupMethod.COURSE.name) || TaskListGroupMethod.COURSE.name).toLowerCase()}</option>
          </select>
        </div>

        {recommendations.length === 0 ? (
          <div className="empty-state">
            <p>{t('noPendingTasks')}</p>
            <p>{t('addTasksFromDashboard')}</p>
          </div>
        ) : (
          groupedTaskLists(recommendations, groupBy).map((taskList, index, list) =>
            (
              <div>
                {sortedTaskList(taskList.tasks, sortBy, sortDescending).map((task, index) => {
                  const dueInfo = formatDueDate(task.due_date);

                  return (
                    <div
                      key={task.id}
                      className={`recommendation-card ${task.is_completed ? 'completed' : ''}`}
                    >
                      <div className="recommendation-rank">
                        <span className="rank-number">{index + 1}</span>
                      </div>

                      <div className="recommendation-checkbox">
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={() => handleComplete(task.id, !task.is_completed)}
                        />
                      </div>

                      <div className="recommendation-content">
                        <div className="recommendation-header">
                          <h3 className="recommendation-title">{task.title}</h3>
                          <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        </div>

                        <div className="recommendation-meta">
                          {task.course_name && (
                            <span
                              className="task-course"
                              style={{backgroundColor: task.course_color || '#4a90a4'}}
                            >
                          {task.course_name}
                        </span>
                          )}
                          <span className={`task-due ${dueInfo.urgent ? 'urgent' : ''}`}>
                          {dueInfo.text}
                        </span>
                          {task.duration && (
                            <span className="task-duration">{task.duration} min</span>
                          )}
                        </div>
                      </div>

                      <div className="recommendation-score">
                        <span className="score-value">{task.score?.toFixed(1)}</span>
                        <span className="score-label">{getScoreLabel(task.score)}</span>
                      </div>
                    </div>
                  );
                })}
                {index < list.length - 1 && (<hr style={{marginTop: "10px", marginBottom: "10px"}} />)}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

export default TodayPlan;
