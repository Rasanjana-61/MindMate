const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "studentwell_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const token = getToken();
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (fetchError) {
    const error = new Error("Cannot connect to the backend. Make sure the API server is running on port 5000.");
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const adminAPI = {
  // Stats
  getStats: () => request("/admin/stats"),

  // Reports
  getReports: () => request("/admin/reports"),
  resolveReport: (postId) => request(`/admin/reports/${postId}/resolve`, { method: "PUT" }),

  // Posts
  deletePost: (postId) => request(`/admin/posts/${postId}`, { method: "DELETE" }),

  // Users
  getUsers: () => request("/admin/users"),
  toggleUser: (userId) => request(`/admin/users/${userId}/toggle`, { method: "PUT" }),

  // Resource Moderation
  getPendingResources: () => request("/admin/resources/pending"),
  approveResource: (resourceId) => request(`/admin/resources/${resourceId}/approve`, { method: "PUT" }),
  rejectResource: (resourceId) => request(`/admin/resources/${resourceId}/reject`, { method: "PUT" }),
};
