/**
 * Chat service for communicating with the chatbot backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE_URL.replace(/\/api$/, "")}/api/chatbot`;

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem("studentwell_token") || localStorage.getItem("authToken");
}

export async function startChatbot() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in first.");
    }

    const response = await fetch(`${API_URL}/start`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to start chatbot");
    }
    return data;
  } catch (error) {
    console.error("Error starting chatbot:", error);
    throw error;
  }
}

export async function sendMessage(message) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in first.");
    }

    const response = await fetch(`${API_URL}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send message");
    }
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function getChatHistory() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in first.");
    }

    const response = await fetch(`${API_URL}/history`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch history");
    }
    return data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
}

export async function endChatbot() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated. Please log in first.");
    }

    const response = await fetch(`${API_URL}/end`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to end chatbot");
    }
    return data;
  } catch (error) {
    console.error("Error ending chatbot:", error);
    throw error;
  }
}
