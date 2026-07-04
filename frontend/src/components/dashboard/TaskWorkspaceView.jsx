import React, { useEffect, useState } from 'react';
import TaskForm from '../TaskForm';
import TaskList from '../TaskList';
import { useLanguage } from '../../hooks/useLanguage';
import { getCourses } from '../../api';

const DENSITY_KEY = 'planora_task_density';

function TaskWorkspaceView({
  workspace,
  titleKey = 'yourTasks',
  showDensityToggle = true,
  showCourseFilter = true,
}) {
  const { t } = useLanguage();
  const {
    tasks,
    error,
    filters,
    setFilters,
    showForm,
    editingTask,
    message,
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleToggleComplete,
    handleReschedule,
    startEdit,
    cancelEdit,
  } = workspace;

  const [density, setDensity] = useState(
    () => localStorage.getItem(DENSITY_KEY) || 'comfortable'
  );
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  useEffect(() => {
    if (!showCourseFilter) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCourses();
        if (!cancelled) setCourses(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCourseFilter]);

  return (
    <>
      {message && (
        <div
          className={`message ${
            message.type === 'error' ? 'error-message' : 'success-message'
          }`}
        >
          {message.text}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {(showForm || editingTask) && (
        <div className="form-card">
          <h2>{editingTask ? t('editTask') : t('addNewTask')}</h2>
          <TaskForm
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            initialData={editingTask}
            onCancel={cancelEdit}
          />
        </div>
      )}

      <div className="tasks-section">
        <div className="tasks-section-heading">
          <h2>{t(titleKey)}</h2>
          {showDensityToggle && (
            <div className="density-toggle" role="group" aria-label={t('displayDensity')}>
              <button
                type="button"
                className={`btn-secondary btn-tiny ${density === 'comfortable' ? 'active' : ''}`}
                onClick={() => setDensity('comfortable')}
              >
                {t('densityComfortable')}
              </button>
              <button
                type="button"
                className={`btn-secondary btn-tiny ${density === 'compact' ? 'active' : ''}`}
                onClick={() => setDensity('compact')}
              >
                {t('densityCompact')}
              </button>
            </div>
          )}
        </div>
        <TaskList
          tasks={tasks}
          onToggle={handleToggleComplete}
          onEdit={startEdit}
          onDelete={handleDeleteTask}
          onReschedule={handleReschedule}
          filters={filters}
          setFilters={setFilters}
          courses={courses}
          density={density}
          showCourseFilter={showCourseFilter}
        />
      </div>
    </>
  );
}

export default TaskWorkspaceView;
