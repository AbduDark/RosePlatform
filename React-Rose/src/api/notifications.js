const API_BASE = import.meta.env.VITE_API_BASE;

export const getAllNotifications = async (page = 1) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/notifications?page=${page}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const getUnreadCount = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      return 0;
    }

    const response = await fetch(`${API_BASE}/notifications/unread-count`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return 0;
      }
      throw new Error(`Failed to fetch unread count: ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) return 0;
    const data = JSON.parse(text);
    console.log("Unread notifications response:", data);
    return data?.data?.count || data?.count || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

export const getNotificationDetails = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notification details");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching notification details:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to mark all notifications as read");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// Admin notification endpoints
export const getNotificationsStatistics = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Making notifications stats request with token:", token.substring(0, 20) + "...");

    const response = await fetch(`${API_BASE}/admin/notifications/statistics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized error in notifications - clearing token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return null;
      }
      throw new Error(data.message?.en || data.message || `Failed to fetch notifications statistics: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching notifications statistics:", error);
    throw error;
  }
};

export const sendNotification = async (notificationData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/admin/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to send notification: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};