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

    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();
    let data = null;

    if (rawBody) {
      if (contentType.includes('application/json')) {
        data = JSON.parse(rawBody);
      } else {
        throw new Error(
          `Unexpected response from ${API_BASE_URL}${endpoint}. The backend may need a restart, or the API URL may be pointing at the frontend server.`
        );
      }
    }

    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data || {};
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

export async function getGoogleLoginAuthUrl() {
  return fetchApi('/auth/google/auth-url');
}

export async function loginWithGoogle(code, state) {
  return fetchApi('/auth/google/login', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
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
  getGoogleLoginAuthUrl,
  loginWithGoogle,
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

/** Public: no cookie required. */
export async function getAiStatus() {
  const response = await fetch(`${API_BASE_URL}/ai/status`);
  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();
  let data = null;
  if (rawBody && contentType.includes('application/json')) {
    data = JSON.parse(rawBody);
  }
  if (!response.ok) {
    throw new Error(data?.error || `AI status failed (${response.status})`);
  }
  return data || {};
}

/** Authenticated chat via server-side OpenAI or OpenRouter (see backend env). */
export async function postAiChat({ message, taskSummary = '', messages = [] }) {
  return fetchApi('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, taskSummary, messages }),
  });
}

export const TaskListSortMethod = Object.freeze({
  DATE: {
    name: "date",
    method: (a, b) => new Date(a.due_date) - new Date(b.due_date),
  },
  TITLE: {
    name: "title",
    method: (a, b) => a.title.localeCompare(b.title)
  },
  PRIORITY: {
    name: "priority",
    method: (a, b) => a.score - b.score
  },
  DURATION: {
    name: "duration",
    method: (a, b) => a.duration - b.duration
  }
})

export function sortedTaskList(list, method = TaskListSortMethod.PRIORITY, reverse= false) {
  if (typeof method === 'string') {
    method = Object.values(TaskListSortMethod).find(m => m.name === method);
  }

  let sortedList = list.toSorted(method.method);
  if (reverse) {
    sortedList.reverse();
  }

  return sortedList;
}

export const formatDueDate = (dateString) => {
  if (!dateString) return { text: 'No due date', urgent: false };

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return { text: 'Overdue', urgent: true };
  }
  if (diffHours <= 6) {
    return { text: 'Due soon', urgent: true };
  }
  if (diffHours <= 24) {
    return { text: 'Due today', urgent: false };
  }
  return {
    text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    urgent: false
  };
};

export const TaskListGroupMethod = Object.freeze({
  COMPLETED: {
    name: "completed",
    getGroupKey: (a) => a.is_completed,
    sort: (a, b) => a.key ? 1 : -1,
  },
  COURSE: {
    name: "course",
    getGroupKey: (a) => a.course_name || 'No Course',
    sort: (a, b) => a.key.localeCompare(b.key),
  },
  PRIORITY: {
    name: "priority",
    getGroupKey: (a) => a.priority,
    sort: (a, b) => {
      let aPriority;
      switch (a.key) {
        case 'low': aPriority = 1; break;
        case 'medium': aPriority = 2; break;
        case 'high': aPriority = 3; break;
        default: aPriority = 0;
      }

      let bPriority;
      switch (b.key) {
        case 'low': bPriority = 1; break;
        case 'medium': bPriority = 2; break;
        case 'high': bPriority = 3; break;
        default: bPriority = 0;
      }

      return bPriority - aPriority;
    },
  },
})

export function groupedTaskLists(list, method = TaskListGroupMethod.COMPLETED) {
  if (typeof method === 'string') {
    method = Object.values(TaskListGroupMethod).find(m => m.name === method);
  }

  let taskListGroups = [];
  list.forEach(task => {
    const groupKey = method.getGroupKey(task);
    let group = taskListGroups.find(g => g.key === groupKey);
    if (!group) {
      group = { key: groupKey, tasks: [] };
      taskListGroups.push(group);
    }
    group.tasks.push(task);
  });

  taskListGroups.sort(method.sort)

  return taskListGroups;

}
