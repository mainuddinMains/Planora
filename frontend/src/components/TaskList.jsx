import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TaskItem from './TaskItem';
import { useLanguage } from '../hooks/useLanguage';

const SEARCH_DEBOUNCE_MS = 350;

function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  filters = {},
  setFilters,
  courses = [],
  density = 'comfortable',
  showCourseFilter = true,
}) {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    if (!setFilters) return undefined;
    const id = setTimeout(() => {
      const q = searchInput.trim();
      const nextSearch = q || undefined;
      setFilters((prev) => {
        if (prev.search === nextSearch) return prev;
        return { ...prev, search: nextSearch };
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, setFilters]);

  const completedCount = useMemo(
    () => tasks.filter((x) => x.is_completed).length,
    [tasks]
  );
  const pendingCount = useMemo(
    () => tasks.filter((x) => !x.is_completed).length,
    [tasks]
  );

  const statusValue = useMemo(() => {
    if (filters.completed === true) return 'completed';
    if (filters.completed === false) return 'active';
    return 'all';
  }, [filters.completed]);

  const setStatus = useCallback(
    (value) => {
      if (!setFilters) return;
      setFilters((prev) => ({
        ...prev,
        completed:
          value === 'all' ? undefined : value === 'active' ? false : true,
      }));
    },
    [setFilters]
  );

  const setPriorityFilter = useCallback(
    (value) => {
      if (!setFilters) return;
      setFilters((prev) => ({
        ...prev,
        priority: !value || value === 'all' ? undefined : value,
      }));
    },
    [setFilters]
  );

  const setCourseFilter = useCallback(
    (value) => {
      if (!setFilters) return;
      setFilters((prev) => ({
        ...prev,
        course_id: !value || value === '' ? undefined : value,
      }));
    },
    [setFilters]
  );

  const priorityValue = filters.priority || 'all';

  return (
    <div className="task-list-container">
      <div className="task-list-toolbar">
        <div className="filter-chips" role="group" aria-label={t('filterBy')}>
          <button
            type="button"
            className={`filter-chip ${statusValue === 'all' ? 'active' : ''}`}
            onClick={() => setStatus('all')}
          >
            {t('all')}
          </button>
          <button
            type="button"
            className={`filter-chip ${statusValue === 'active' ? 'active' : ''}`}
            onClick={() => setStatus('active')}
          >
            {t('filterActive')}
          </button>
          <button
            type="button"
            className={`filter-chip ${statusValue === 'completed' ? 'active' : ''}`}
            onClick={() => setStatus('completed')}
          >
            {t('completed')}
          </button>
        </div>

        <div className="task-list-filters-row">
          <label className="sr-only" htmlFor="task-priority-filter">
            {t('priority')}
          </label>
          <select
            id="task-priority-filter"
            className="task-filter-select"
            value={priorityValue}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">{t('priorityAll')}</option>
            <option value="high">{t('high')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="low">{t('low')}</option>
          </select>

          {showCourseFilter && courses.length > 0 && (
            <>
              <label className="sr-only" htmlFor="task-course-filter">
                {t('course')}
              </label>
              <select
                id="task-course-filter"
                className="task-filter-select"
                value={filters.course_id ?? ''}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="">{t('allCourses')}</option>
                {courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="task-list-header">
        <div className="search-box">
          <input
            type="search"
            placeholder={t('search') + '...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
            aria-label={t('search')}
          />
        </div>
        <div className="task-stats">
          <span className="stat">
            {pendingCount} {t('pending')}
          </span>
          <span className="stat">
            {completedCount} {t('completed')}
          </span>
        </div>
      </div>

      <div className={`task-list ${density === 'compact' ? 'task-list--compact' : ''}`}>
        {tasks.length === 0 ? (
          <div className="empty-state">
            {searchInput.trim() ? t('noTasksMatch') : t('noTasks')}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              density={density}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;
