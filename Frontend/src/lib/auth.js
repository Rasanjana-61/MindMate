const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "studentwell_token";

function toAbsoluteUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL.replace(/\/api$/, "")}${url}`;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
      clearToken();
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    error.errors = data.errors || {};
    error.data = data;
    throw error;
  }

  return data;
}

function toDisplayUser(user) {
  const emailPrefix = user.email.split("@")[0];
  const displayName = user.fullName || user.studentId || emailPrefix;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || "")
    .join("");

  return {
    ...user,
    name: displayName,
    avatar: initials || (user.studentId || emailPrefix).slice(0, 2).toUpperCase(),
    avatarUrl: toAbsoluteUrl(user.avatarUrl),
  };
}

async function registerUser(payload) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    token: data.token,
    user: toDisplayUser(data.user),
    message: data.message,
  };
}

async function loginUser(payload) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    token: data.token,
    user: toDisplayUser(data.user),
    message: data.message,
  };
}

async function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

async function fetchCurrentUser() {
  if (!getToken()) {
    return null;
  }

  const data = await request("/auth/me");
  return toDisplayUser(data.user);
}

async function updateProfile(payload) {
  const data = await request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return {
    user: toDisplayUser(data.user),
    message: data.message,
  };
}

async function changePassword(payload) {
  return request("/auth/profile/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function uploadProfileAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const data = await request("/auth/profile/avatar", {
    method: "POST",
    body: formData,
  });

  return {
    user: toDisplayUser(data.user),
    message: data.message,
  };
}

async function fetchMoodOverview(timeframe = "week") {
  return request(`/moods?timeframe=${timeframe}`);
}

async function createMoodLog(payload) {
  return request("/moods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateMoodLog(logId, payload) {
  return request(`/moods/${logId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deleteMoodLog(logId) {
  return request(`/moods/${logId}`, {
    method: "DELETE",
  });
}

async function fetchFocusOverview() {
  return request("/focus/overview");
}

async function createTask(payload) {
  return request("/focus/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateTask(taskId, payload) {
  return request(`/focus/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deleteTask(taskId) {
  return request(`/focus/tasks/${taskId}`, {
    method: "DELETE",
  });
}

async function createFocusSession(payload) {
  return request("/focus/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function fetchPeerOverview(category = "All") {
  const query = encodeURIComponent(category);
  return request(`/peer/overview?category=${query}`);
}

async function createPeerPost(payload) {
  return request("/peer/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updatePeerPost(postId, payload) {
  return request(`/peer/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deletePeerPost(postId) {
  return request(`/peer/posts/${postId}`, {
    method: "DELETE",
  });
}

async function createPeerReply(postId, payload) {
  return request(`/peer/posts/${postId}/replies`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updatePeerReply(replyId, payload) {
  return request(`/peer/replies/${replyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deletePeerReply(replyId) {
  return request(`/peer/replies/${replyId}`, {
    method: "DELETE",
  });
}

async function markPeerNotificationsRead() {
  return request("/peer/notifications/read", {
    method: "POST",
  });
}

async function fetchResources(search = "") {
  const query = encodeURIComponent(search);
  return request(`/resources?search=${query}`);
}

async function uploadResource(file, subject = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);

  return request("/resources", {
    method: "POST",
    body: formData,
  });
}

async function fetchResource(resourceId) {
  return request(`/resources/${resourceId}`);
}

async function regenerateResource(resourceId, payload = {}) {
  return request(`/resources/${resourceId}/regenerate`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function deleteResource(resourceId) {
  return request(`/resources/${resourceId}`, {
    method: "DELETE",
  });
}

async function downloadResourceSummary(resourceId) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.message || "Download failed.");
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    filename: filenameMatch?.[1] || `resource-summary-${resourceId}.pdf`,
  };
}

async function fetchNotifications() {
  return request("/notifications");
}

async function markAllNotificationsRead() {
  return request("/notifications/read-all", {
    method: "POST",
  });
}

async function markNotificationRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
}

async function fetchDashboardOverview() {
  return request("/dashboard/overview");
}

export {
  API_BASE_URL,
  changePassword,
  clearToken,
  createFocusSession,
  createMoodLog,
  createPeerPost,
  createPeerReply,
  createTask,
  deleteTask,
  deleteMoodLog,
  deletePeerPost,
  deletePeerReply,
  deleteResource,
  downloadResourceSummary,
  fetchCurrentUser,
  fetchDashboardOverview,
  fetchFocusOverview,
  fetchMoodOverview,
  fetchNotifications,
  fetchPeerOverview,
  fetchResource,
  fetchResources,
  getToken,
  loginUser,
  markPeerNotificationsRead,
  logoutUser,
  markAllNotificationsRead,
  markNotificationRead,
  regenerateResource,
  registerUser,
  saveToken,
  uploadResource,
  updatePeerPost,
  updatePeerReply,
  updateTask,
  updateMoodLog,
  updateProfile,
  uploadProfileAvatar,
};
