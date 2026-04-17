const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('forever_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }
  return response.json();
}

export { API_BASE };
