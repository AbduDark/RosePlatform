const API_BASE = import.meta.env.VITE_API_BASE;

export const getLessonComments = async (lessonId, token, page = 1) => {
  const headers = {
    "Accept": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}/lessons/${lessonId}/comments?page=${page}`, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message?.ar || data.message?.en || "Failed to fetch comments");
  }
  return data.data; // paginated list or comments array
};

export const createComment = async ({ lesson_id, content, parent_id = null }, token) => {
  const res = await fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ lesson_id, content, parent_id })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message?.ar || data.message?.en || "Failed to add comment");
  }
  return data.data?.comment || data.data;
};

export const updateComment = async (commentId, content, token) => {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message?.ar || data.message?.en || "Failed to update comment");
  }
  return data.data;
};

export const deleteComment = async (commentId, token) => {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message?.ar || data.message?.en || "Failed to delete comment");
  }
  return data;
};

export const toggleLikeComment = async (commentId, token) => {
  const res = await fetch(`${API_BASE}/comments/${commentId}/like`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message?.ar || data.message?.en || "Failed to like comment");
  }
  return data.data; // { liked, likes_count }
};
