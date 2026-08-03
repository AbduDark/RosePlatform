
const API_BASE = import.meta.env.VITE_API_BASE;

// Helper: pick localized message with safe string fallback support
const getMessage = (data, lang = "ar") => {
  if (!data) return null;

  // Handle direct string messages
  if (typeof data.message === "string") return data.message;

  // Handle localized message objects { ar: "...", en: "..." }
  if (typeof data.message === "object" && data.message !== null) {
    const message = data.message[lang] || data.message.ar || data.message.en || Object.values(data.message)[0];
    return typeof message === "string" ? message : JSON.stringify(message);
  }

  // Handle error messages
  if (data.error) {
    if (typeof data.error === "string") return data.error;
    if (typeof data.error === "object" && data.error !== null) {
      const error = data.error[lang] || data.error.ar || data.error.en || Object.values(data.error)[0];
      return typeof error === "string" ? error : JSON.stringify(error);
    }
  }

  // Handle validation errors
  if (data.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0];
    }
    return typeof firstError === "string" ? firstError : JSON.stringify(firstError);
  }

  return null;
};

// Helper function for handling API responses
const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  
  let data;
  try {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } catch (parseError) {
    throw new Error(`Failed to parse response: ${parseError.message}`);
  }

  if (!response.ok) {
    const errorMessage = getMessage(data) || (typeof data === "string" ? data.substring(0, 200) : `Server error (${response.status})`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Admin Lesson Management APIs

export const getAllLessons = async (params = {}, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      throw new Error("No authentication token found");
    }

    const { course_id, page = 1, per_page = 15, search = "" } = params;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    const queryParams = new URLSearchParams();
    if (course_id && course_id !== "all") queryParams.append("course_id", course_id);
    if (page) queryParams.append("page", page);
    if (per_page) queryParams.append("per_page", per_page);
    if (search) queryParams.append("search", search);

    const url = `${API_BASE}/admin/lessons${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    console.log("Fetching lessons from:", url);
    console.log("Using token:", authToken.substring(0, 20) + "...");
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized error in lessons API");
        throw new Error("جلسة تسجيل الدخول انتهت. يرجى إعادة تسجيل الدخول.");
      }
      throw new Error(data.message?.en || data.message || `Failed to fetch lessons: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching lessons:", error);
    throw error;
  }
};

export const createLesson = async (lessonData, token) => {
  try {
    if (!lessonData.course_id || !lessonData.title) {
      throw new Error("course_id and title are required");
    }
    
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Clean and validate lesson data
    const cleanData = {
      course_id: parseInt(lessonData.course_id),
      title: lessonData.title.trim(),
      description: lessonData.description?.trim() || "",
      content: lessonData.content?.trim() || "",
      order: parseInt(lessonData.order) || 1,
      duration: lessonData.duration?.trim() || null,
      target_gender: lessonData.target_gender || "both",
      is_free: Boolean(lessonData.is_free),
    };

    console.log("Creating lesson with data:", cleanData);

    return await fetchJson(`${API_BASE}/admin/lessons`, {
      method: "POST",
      headers,
      body: JSON.stringify(cleanData),
    });
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
};

export const updateLesson = async (lessonId, lessonData, token) => {
  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }
    
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Clean and validate lesson data
    const cleanData = {
      title: lessonData.title?.trim(),
      description: lessonData.description?.trim() || "",
      content: lessonData.content?.trim() || "",
      order: parseInt(lessonData.order) || 1,
      duration: lessonData.duration?.trim() || null,
      target_gender: lessonData.target_gender || "both",
      is_free: Boolean(lessonData.is_free),
    };

    // Remove undefined values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    console.log("Updating lesson with data:", cleanData);

    return await fetchJson(`${API_BASE}/admin/lessons/${lessonId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(cleanData),
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
};

export const deleteLesson = async (lessonId, token) => {
  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }

    const headers = {
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Deleting lesson:", lessonId);

    return await fetchJson(`${API_BASE}/admin/lessons/${lessonId}`, {
      method: "DELETE",
      headers,
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
  }
};

export const uploadLessonVideo = async (lessonId, videoFile, token, onProgress = null) => {
  try {
    if (!lessonId || !videoFile) {
      throw new Error("lessonId and videoFile are required");
    }

    // Validate video file
    if (!videoFile.type.startsWith("video/")) {
      throw new Error("Please select a valid video file");
    }

    // Check file size (max 10GB)
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (videoFile.size > maxSize) {
      throw new Error("Video file size must be less than 10GB");
    }

    const formData = new FormData();
    formData.append("video", videoFile);

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Uploading video for lesson:", lessonId, "File size:", videoFile.size);

    // Use XMLHttpRequest for progress tracking if callback provided
    if (onProgress && typeof onProgress === "function") {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (parseError) {
              resolve({ success: true, response: xhr.responseText });
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              const errMsg = getMessage(errorData) || `Upload failed (${xhr.status})`;
              reject(new Error(errMsg));
            } catch (parseError) {
              reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
            }
          }
        });
        
        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });
        
        xhr.open("POST", `${API_BASE}/admin/video/${lessonId}/upload`);
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        xhr.send(formData);
      });
    }

    // Fallback to fetch if no progress callback
    return await fetchJson(`${API_BASE}/admin/video/${lessonId}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};

export const deleteLessonVideo = async (lessonId, token) => {
  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }

    const headers = {
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Deleting video for lesson:", lessonId);

    return await fetchJson(`${API_BASE}/admin/video/${lessonId}/delete`, {
      method: "DELETE",
      headers,
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error;
  }
};

export const saveYouTubeVideoUrl = async (lessonId, youtubeUrl, token) => {
  try {
    if (!lessonId || !youtubeUrl) {
      throw new Error("lessonId and youtubeUrl are required");
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    return await fetchJson(`${API_BASE}/admin/video/${lessonId}/youtube`, {
      method: "POST",
      headers,
      body: JSON.stringify({ youtube_url: youtubeUrl }),
    });
  } catch (error) {
    console.error("Error saving YouTube video URL:", error);
    throw error;
  }
};

export const getVideoInfo = async (lessonId, token) => {
  try {
    if (!lessonId) throw new Error("lessonId is required");
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    return await fetchJson(`${API_BASE}/video/${lessonId}/info`, {
      method: "GET",
      headers,
    });
  } catch (error) {
    console.error("Error getting video info:", error);
    throw error;
  }
};

export const getVideoProcessingStatus = async (lessonId, token) => {
  try {
    if (!lessonId) throw new Error("lessonId is required");
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    return await fetchJson(`${API_BASE}/lessons/${lessonId}/status`, {
      method: "GET",
      headers,
    });
  } catch (error) {
    console.error("Error getting video processing status:", error);
    throw error;
  }
};

// Helper function to extract and normalize lessons data from any API response structure
export const extractLessonsData = (res) => {
  let obj = res;

  // 1. If stringified JSON, parse it
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      // Keep as is
    }
  }

  // 2. Safely traverse down up to 5 levels to find object containing 'lessons'
  for (let i = 0; i < 5; i++) {
    if (!obj || typeof obj !== "object") break;

    if (Array.isArray(obj.lessons)) {
      break; // Found the target layer with lessons array!
    }

    if (obj.data !== undefined && obj.data !== null) {
      let child = obj.data;
      if (typeof child === "string") {
        try {
          child = JSON.parse(child);
        } catch {
          // ignore
        }
      }
      if (typeof child === "object" && child !== null) {
        obj = child;
        continue;
      }
    }

    break;
  }

  const lessons = Array.isArray(obj?.lessons) ? obj.lessons : [];
  const course = obj?.course || null;
  const user_subscribed = Boolean(obj?.user_subscribed);
  const subscription_info = obj?.subscription_info || null;

  return {
    lessons,
    course,
    user_subscribed,
    subscription_info,
    raw: res,
  };
};

// Student Lesson APIs

export const getLessonsByCourse = async (courseId, token) => {
  try {
    if (!courseId) throw new Error("courseId is required");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Fetching lessons for course:", courseId);

    const rawResponse = await fetchJson(`${API_BASE}/courses/${courseId}/lessons`, {
      method: "GET",
      headers,
    });

    const normalized = extractLessonsData(rawResponse);
    console.log("Normalized lessons response:", normalized);

    return normalized;
  } catch (error) {
    console.error("Error fetching course lessons:", error);
    throw error;
  }
};

export const getLessonDetails = async (lessonId, token) => {
  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Fetching lesson details:", lessonId);

    return await fetchJson(`${API_BASE}/lessons/${lessonId}`, {
      method: "GET",
      headers,
    });
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    throw error;
  }
};

export const getLessonComments = async (lessonId, token) => {
  try {
    if (!lessonId) throw new Error("lessonId is required");
    
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Fetching comments for lesson:", lessonId);

    const response = await fetchJson(`${API_BASE}/lessons/${lessonId}/comments`, {
      method: "GET",
      headers,
    });

    // Extract comments from response
    return response.data?.comments || response.comments || [];
  } catch (error) {
    console.error("Error fetching lesson comments:", error);
    throw error;
  }
};

export const createComment = async ({ lesson_id, content }, token) => {
  try {
    if (!lesson_id || !content) {
      throw new Error("lesson_id and content are required");
    }
    
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const commentData = {
      lesson_id: parseInt(lesson_id),
      content: content.trim(),
    };

    console.log("Creating comment:", commentData);

    const response = await fetchJson(`${API_BASE}/comments`, {
      method: "POST",
      headers,
      body: JSON.stringify(commentData),
    });

    return response.data?.comment || response;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const deleteComment = async (commentId, token) => {
  try {
    if (!commentId) {
      throw new Error("commentId is required");
    }

    const headers = {
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log("Deleting comment:", commentId);

    return await fetchJson(`${API_BASE}/comments/${commentId}`, {
      method: "DELETE",
      headers,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

// Security logging and reporting
export const reportSuspiciousActivity = async (
  lessonId,
  activityType,
  details,
  token
) => {
  try {
    if (!lessonId || !activityType) {
      throw new Error("lessonId and activityType are required");
    }

    const userInfo = {
      id: "user",
      email: "unknown@example.com",
      name: "User",
    };
    
    const securityLog = {
      lessonId,
      activityType,
      details,
      userId: userInfo.id,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionInfo: {
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
      },
    };

    // Store locally for analysis
    try {
      const existingLogs = JSON.parse(
        localStorage.getItem("security_logs") || "[]"
      );
      existingLogs.push(securityLog);

      // Keep only last 50 logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }

      localStorage.setItem("security_logs", JSON.stringify(existingLogs));

      // Console warning for development
      console.warn("🚨 Security Violation:", {
        type: activityType,
        lesson: lessonId,
        user: userInfo.id,
        details: details,
        timestamp: new Date().toISOString(),
      });

      // Show user notification for serious violations
      if (
        [
          "script_injection",
          "dev_tools_opened",
          "download_attempt",
          "suspicious_request",
        ].includes(activityType)
      ) {
        showSecurityNotification(activityType);
      }
    } catch (storageError) {
      console.error("Failed to log security event:", storageError);
    }

    return { success: true, logged: true, timestamp: securityLog.timestamp };
  } catch (error) {
    console.error("Error reporting suspicious activity:", error);
    return { success: false, error: error.message };
  }
};

// Enhanced security notification
const showSecurityNotification = (activityType) => {
  const messages = {
    script_injection: "تم اكتشاف محاولة حقن سكريبت مشبوهة",
    dev_tools_opened: "تم اكتشاف فتح أدوات المطور",
    download_attempt: "تم اكتشاف محاولة تحميل غير مصرح بها",
    suspicious_request: "تم اكتشاف طلب مشبوه",
  };

  const message = messages[activityType] || "تم اكتشاف نشاط مشبوه";

  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff4444, #cc0000);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    z-index: 10001;
    font-family: 'Arial', sans-serif;
    box-shadow: 0 8px 32px rgba(255, 68, 68, 0.3);
    max-width: 350px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <span style="font-size: 20px;">🛡️</span>
      <span style="font-weight: bold; font-size: 14px;">تحذير أمني</span>
    </div>
    <div style="font-size: 13px; line-height: 1.4; margin-bottom: 8px;">
      ${message}
    </div>
    <div style="font-size: 11px; opacity: 0.8; color: #ffcccc;">
      ${new Date().toLocaleString("ar-SA")}
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  notification.style.transform = "translateX(100%)";
  notification.style.transition = "transform 0.3s ease-out";
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 10);

  // Auto remove after 6 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 6000);
};

// Batch operations for admin efficiency
export const batchUpdateLessons = async (updates, token) => {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("Updates array is required");
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const result = await updateLesson(update.id, update.data, token);
        results.push({ id: update.id, success: true, data: result });
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      total: updates.length,
      successful: results.length,
      failed: errors.length,
    };
  } catch (error) {
    console.error("Error in batch update:", error);
    throw error;
  }
};

export const batchDeleteLessons = async (lessonIds, token) => {
  try {
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new Error("Lesson IDs array is required");
    }

    const results = [];
    const errors = [];

    for (const lessonId of lessonIds) {
      try {
        await deleteLesson(lessonId, token);
        results.push({ id: lessonId, success: true });
      } catch (error) {
        errors.push({ id: lessonId, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      total: lessonIds.length,
      successful: results.length,
      failed: errors.length,
    };
  } catch (error) {
    console.error("Error in batch delete:", error);
    throw error;
  }
};
