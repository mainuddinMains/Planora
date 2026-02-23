import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../api';

export function useWeeklyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  const weekRange = useMemo(() => ({
    start: weekDays[0].toISOString(),
    end: weekDays[6].toISOString()
  }), [weekDays]);

  useEffect(() => {
    fetchTasks();
  }, [weekRange.start, weekRange.end]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tasksByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach(day => {
      grouped[day.toDateString()] = [];
    });

    tasks.forEach(task => {
      if (task.due_date) {
        const taskDate = new Date(task.due_date).toDateString();
        if (grouped[taskDate] !== undefined) {
          grouped[taskDate].push(task);
        }
      }
    });

    return grouped;
  }, [tasks, weekDays]);

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  return {
    tasks,
    tasksByDay,
    weekDays,
    currentWeekStart,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    refresh: fetchTasks
  };
}
