import { useState, useEffect } from 'react';
import { getCourses, createCourse } from '../api';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (courseData) => {
    const newCourse = await createCourse(courseData);
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  return {
    courses,
    loading,
    error,
    addCourse,
    refresh: fetchCourses
  };
}
