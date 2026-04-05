const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getTasks: () => request('/tasks'),
  createTask: (task) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  updateTask: (taskId, task) =>
    request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  deleteTask: (taskId) =>
    request(`/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  toggleTaskCompletion: (taskId) =>
    request(`/tasks/${taskId}/toggle-completion`, {
      method: 'PATCH',
    }),
  getFocusSettings: () => request('/focus/settings'),
  updateFocusSettings: (settings) =>
    request('/focus/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getFocusStats: () => request('/focus/stats'),
  recordSession: (session) =>
    request('/focus/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    }),
};
