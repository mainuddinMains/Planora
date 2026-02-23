import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api';

export function useTasks(initialFilters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData) => {
    const newTask = await createTask(taskData);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const editTask = async (id, updates) => {
    const updatedTask = await updateTask(id, updates);
    setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
    return updatedTask;
  };

  const removeTask = async (id) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleComplete = async (id, isCompleted) => {
    return editTask(id, { is_completed: isCompleted });
  };

  return {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    addTask,
    editTask,
    removeTask,
    toggleComplete,
    refresh: fetchTasks
  };
}
