const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

async function fetchApi(endpoint, options = {}) {
  try {
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
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 5001.');
    }
    throw error;
  }
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
  console.log('API URL being used:', API_BASE_URL);
  console.log('Full URL:', `${API_BASE_URL}/auth/login`);
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

export async function getNotifications(unreadOnly = false) {
  return fetchApi(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
}

export async function getUnreadCount() {
  return fetchApi('/notifications/unread-count');
}

export async function markNotificationRead(id) {
  return fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead() {
  return fetchApi('/notifications/read-all', { method: 'PUT' });
}

export async function deleteNotification(id) {
  return fetchApi(`/notifications/${id}`, { method: 'DELETE' });
}

export async function getEmailSources() {
  console.log('API_BASE_URL:', API_BASE_URL);
  return fetchApi('/email_sources');
}

export async function createEmailSource(data) {
  return fetchApi('/email_sources', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmailSource(id, data) {
  return fetchApi(`/email_sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEmailSource(id) {
  return fetchApi(`/email_sources/${id}`, { method: 'DELETE' });
}

export async function triggerEmailSync() {
  return fetchApi('/email/now', { method: 'POST' });
}

export async function getEmailSyncStatus() {
  return fetchApi('/email/status');
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
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getEmailSources,
  createEmailSource,
  updateEmailSource,
  deleteEmailSource,
  triggerEmailSync,
  getEmailSyncStatus,
  getMicrosoftAuthUrl,
  connectMicrosoftAccount,
  getMicrosoftStatus,
  disconnectMicrosoftAccount,
};

export async function getMicrosoftAuthUrl() {
  return fetchApi('/microsoft/auth-url');
}

export async function connectMicrosoftAccount(code) {
  return fetchApi('/microsoft/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getMicrosoftStatus() {
  return fetchApi('/microsoft/status');
}

export async function disconnectMicrosoftAccount() {
  return fetchApi('/microsoft/disconnect', { method: 'POST' });
}

export async function getGoogleCalendarAuthUrl() {
  return fetchApi('/google-calendar/auth-url');
}

export async function connectGoogleCalendar(code) {
  return fetchApi('/google-calendar/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getGoogleCalendarStatus() {
  return fetchApi('/google-calendar/status');
}

export async function disconnectGoogleCalendar() {
  return fetchApi('/google-calendar/disconnect', { method: 'POST' });
}

export async function getGoogleCalendarEvents(year, month) {
  if (year && month) {
    return fetchApi(`/google-calendar/events?year=${year}&month=${month}`);
  }
  return fetchApi(`/google-calendar/events`);
}

export async function createGoogleCalendarEvent(event) {
  return fetchApi('/google-calendar/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateGoogleCalendarEvent(eventId, event) {
  return fetchApi(`/google-calendar/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteGoogleCalendarEvent(eventId) {
  return fetchApi(`/google-calendar/events/${eventId}`, { method: 'DELETE' });
}

export async function exportTaskToGoogleCalendar(taskId) {
  return fetchApi(`/google-calendar/export-task/${taskId}`, { method: 'POST' });
}
