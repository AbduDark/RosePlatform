const API_BASE = import.meta.env.VITE_API_BASE;

const getErrorMessage = (payload, currentLang = 'ar') => {
  if (typeof payload === 'object' && payload?.message) {
    if (typeof payload.message === 'object') {
      return payload.message[currentLang] || payload.message.en || payload.message.ar || 'An error occurred';
    }
    return payload.message;
  }
  if (typeof payload === 'string') {
    return payload;
  }
  return 'An error occurred';
};
export const login = async (email, password, deviceId = null, deviceInfo = null) => {
  const body = { email, password };
  
  // Add device information if available
  if (deviceId) {
    body.device_id = deviceId;
  }
  if (deviceInfo) {
    body.device_info = deviceInfo;
  }
  
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message.ar || "Login failed. Please check your credentials."
    );
  }

  return data;
};
export const register = async (userData, lang = "ar") => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      const messages = Object.values(data.errors)
        .map((errObj) => {
          const msg = errObj[lang] || errObj["en"] || "";
          return msg.split("|")[0].trim();
        })
        .join(" - ");

      throw new Error(messages);
    }
    throw new Error(
      data.message?.[lang] ||
        data.message?.en ||
        "Registration failed. Please check your information."
    );
  }

  return data;
};
export const logout = async (token) => {
  await fetch(`${API_BASE}/auth/force-logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};
export const resetPassword = async (userData) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};
export const verifyEmail = async (email, pin) => {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin }),
  });
  return res.json();
};
export const getProfile = async (token) => {
  if (!token) {
    throw new Error("No authentication token provided");
  }
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const message =
        (typeof payload === "object" && payload?.message) ||
        (typeof payload === "string"
          ? `Server error (${res.status}): ${payload
              .substring(0, 180)
              .replace(/\n/g, " ")}`
          : `Failed to fetch profile (Status: ${res.status})`);
      throw new Error(message);
    }
    return payload.data || payload;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};
export const updateProfile = async ({ name, phone, image }, token, lang = 'ar') => {
  if (!token) {
    throw new Error("No authentication token provided");
  }

  if (!name && !phone && !image) {
    throw new Error("At least one field (name, phone, or image) is required");
  }

  const formData = new FormData();
  if (name) formData.append("name", name.trim());
  if (phone) formData.append("phone", phone.trim());
  if (image instanceof File) {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(image.type)) {
      throw new Error("Image must be a JPEG, PNG, or GIF");
    }
    if (image.size > 5 * 1024 * 1024) {
      // 5MB limit
      throw new Error("Image size must not exceed 5MB");
    }
    formData.append("image", image);
  } else if (typeof image === "string" && image) {
    formData.append("image", image);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": lang,
      },
      body: formData,
    });

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const message = getErrorMessage(payload, lang);
      throw new Error(message);
    }
    return payload;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};
export const changePassword = async (
  { current_password, new_password, new_password_confirmation },
  token,
  lang = 'ar'
) => {
  if (!token) {
    throw new Error("No authentication token provided");
  }
  if (!current_password || !new_password || !new_password_confirmation) {
    throw new Error(
      "All fields (current password, new password, and confirmation) are required"
    );
  }
  if (new_password.trim() !== new_password_confirmation.trim()) {
    throw new Error("New password and confirmation do not match");
  }
  try {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Language": lang,
      },
      body: JSON.stringify({
        current_password: current_password.trim(),
        new_password: new_password.trim(),
        new_password_confirmation: new_password_confirmation.trim(),
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      const message = getErrorMessage(payload, lang);
      throw new Error(message);
    }
    return payload;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

// Dashboard statistics
export const getDashboardStats = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log("Making dashboard stats request with token:", token.substring(0, 20) + "...");

    const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("Dashboard stats response:", data);

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized error - clearing token and redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return null;
      }
      throw new Error(data.message?.en || data.message || `Failed to fetch dashboard stats: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

// Admin authentication
export const adminLogin = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message.ar || "Admin login failed.");
    }
    return data;
  } catch (error) {
    console.error("Admin login error:", error);
    throw error;
  }
};

// Admin user management endpoints
export const getAllUsers = async (page = 1, perPage = 6) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE}/admin/users?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to update user: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - Please login again");
      }
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to delete user: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};