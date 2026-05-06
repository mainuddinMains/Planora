import { useState, useEffect, useCallback } from 'react';
import { useTasks } from './useTasks';
import { useLanguage } from './useLanguage';

/**
 * Shared task CRUD + form state for Dashboard and Tasks pages.
 * Maintains an unfiltered `insightTasks` fetch so stats/focus stay accurate when the list uses filters.
 */
export function useTaskWorkspace(initialFilters = {}) {
  const { t } = useLanguage();
  const insights = useTasks({});
  const {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    removeTask,
    toggleComplete,
    filters,
    setFilters,
    refresh,
  } = useTasks(initialFilters);

  const refreshInsights = insights.refresh;

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState(null);

  const clearMessageLater = useCallback(() => {
    setTimeout(() => setMessage(null), 3000);
  }, []);

  useEffect(() => {
    const handleOpenAddTask = () => {
      setShowForm(true);
      setEditingTask(null);
    };
    window.addEventListener('openAddTask', handleOpenAddTask);
    return () => window.removeEventListener('openAddTask', handleOpenAddTask);
  }, []);

  const openAddForm = useCallback(() => {
    setShowForm(true);
    setEditingTask(null);
  }, []);

  const handleAddTask = async (taskData) => {
    try {
      await addTask(taskData);
      refreshInsights();
      setShowForm(false);
      setMessage({ type: 'success', text: t('taskAdded') });
      clearMessageLater();
    } catch (err) {
      setMessage({ type: 'error', text: t('failedToAdd') + err.message });
      clearMessageLater();
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      await editTask(editingTask.id, taskData);
      refreshInsights();
      setEditingTask(null);
      setMessage({ type: 'success', text: t('taskUpdated') });
      clearMessageLater();
    } catch (err) {
      setMessage({ type: 'error', text: t('failedToUpdate') + err.message });
      clearMessageLater();
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await removeTask(id);
        refreshInsights();
        setMessage({ type: 'success', text: t('taskDeleted') });
        clearMessageLater();
      } catch (err) {
        setMessage({ type: 'error', text: t('failedToDelete') + err.message });
        clearMessageLater();
      }
    }
  };

  const handleToggleComplete = async (id, isCompleted) => {
    try {
      await toggleComplete(id, isCompleted);
      refreshInsights();
    } catch (err) {
      setMessage({ type: 'error', text: t('failedToUpdateTask') + err.message });
      clearMessageLater();
    }
  };

  const handleReschedule = useCallback(async (task) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    try {
      await editTask(task.id, { due_date: tomorrow.toISOString() });
      refreshInsights();
      setMessage({ type: 'success', text: t('taskRescheduled') });
      clearMessageLater();
    } catch (err) {
      setMessage({ type: 'error', text: t('failedToUpdate') + err.message });
      clearMessageLater();
    }
  }, [editTask, refreshInsights, t, clearMessageLater]);

  const startEdit = (task) => {
    setEditingTask(task);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setShowForm(false);
  };

  return {
    tasks,
    /** Full task list (no filters) for dashboard stats / focus column */
    insightTasks: insights.tasks,
    loading,
    /** True while the unfiltered insight list is loading (use on Dashboard) */
    insightsLoading: insights.loading,
    error,
    filters,
    setFilters,
    refresh,
    showForm,
    setShowForm,
    editingTask,
    message,
    openAddForm,
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleToggleComplete,
    handleReschedule,
    startEdit,
    cancelEdit,
  };
}
