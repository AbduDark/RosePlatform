const API_BASE = import.meta.env.VITE_API_BASE;

const getErrorMessage = (errorData, currentLang = 'ar') => {
  if (typeof errorData === 'object' && errorData?.message) {
    if (typeof errorData.message === 'object') {
      return errorData.message[currentLang] || errorData.message.en || errorData.message.ar || 'An error occurred';
    }
    return errorData.message;
  }
  if (typeof errorData === 'string') {
    return errorData;
  }
  return 'An error occurred';
};

export const addToFavorites = async (token, courseId, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/favorite/${courseId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": lang,
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
};

export const removeFromFavorites = async (token, courseId, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/favorite/${courseId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": lang,
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
};

export const getFavoriteSubscriptions = async (token, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/favorite-subscriptions `, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": lang,
      },
    });

    const data = await res.json();
    
    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error fetching favorite subscriptions:", error);
    throw error;
  }
};

export const checkIfFavorite = async (token, courseId, lang = 'ar') => {
  try {
    const favorites = await getFavoriteSubscriptions(token, lang);
    const favoriteCourseIds = favorites?.data?.subscriptions?.map(sub => sub.course_id) || [];
    return favoriteCourseIds.includes(courseId);
  } catch (error) {
    console.error("Error checking if course is favorite:", error);
    return false;
  }
};

export const toggleFavorite = async (token, courseId, isFavorite, lang = 'ar') => {
  try {
    if (isFavorite) {
      return await removeFromFavorites(token, courseId, lang);
    } else {
      return await addToFavorites(token, courseId, lang);
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};
