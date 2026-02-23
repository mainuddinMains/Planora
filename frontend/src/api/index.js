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

export default {
  getHealth,
  register,
  login,
  logout,
  getCurrentUser,
};
