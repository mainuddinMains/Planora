const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export async function register(email, password, name) {
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email, password) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetchApi('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser() {
  return fetchApi('/auth/me');
}

export async function getTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.completed !== undefined) params.append('completed', filters.completed);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.course_id) params.append('course_id', filters.course_id);
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  return fetchApi(`/tasks${queryString ? `?${queryString}` : ''}`);
}

export async function getTask(id) {
  return fetchApi(`/tasks/${id}`);
}

export async function createTask(taskData) {
  return fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTask(id, updates) {
  return fetchApi(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id) {
  return fetchApi(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function getCourses() {
  return fetchApi('/courses');
}

export async function createCourse(courseData) {
  return fetchApi('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
}

export async function updateCourse(id, updates) {
  return fetchApi(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteCourse(id) {
  return fetchApi(`/courses/${id}`, {
    method: 'DELETE',
  });
}

export async function getTodayRecommendations(limit = 10) {
  return fetchApi(`/recommendations/today?limit=${limit}`);
}

export async function getWorkload(startDate, endDate) {
  return fetchApi(`/recommendations/workload?startDate=${startDate}&endDate=${endDate}`);
}

export default {
  getHealth,
  register,
  login,
  logout,
  getCurrentUser,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getTodayRecommendations,
  getWorkload,
};
