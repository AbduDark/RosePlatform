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

export const getMySubscriptions = async (token, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/my-subscriptions`, {
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
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
};

export const subscribeToCourse = async (token, subscriptionData, lang = 'ar') => {
  try {
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": lang,
    };

    // إذا كانت البيانات تحتوي على FormData أو ملف
    if (subscriptionData instanceof FormData) {
      body = subscriptionData;
      // لا نضع Content-Type للـ FormData
    } else if (subscriptionData.payment_proof instanceof File) {
      body = new FormData();
      Object.keys(subscriptionData).forEach(key => {
        body.append(key, subscriptionData[key]);
      });
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(subscriptionData);
    }

    const res = await fetch(`${API_BASE}/subscribe`, {
      method: "POST",
      headers,
      body,
    });

    const data = await res.json();

    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error subscribing to course:", error);
    throw error;
  }
};

export const cancelSubscription = async (token, subscriptionId, lang = 'ar') => {
  try {
    const res = await fetch(
      `${API_BASE}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Accept-Language": lang,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
};

export const renewSubscription = async (token, renewalData, lang = 'ar') => {
  try {
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": lang,
    };

    if (renewalData instanceof FormData) {
      body = renewalData;
    } else if (renewalData.payment_proof instanceof File) {
      body = new FormData();
      Object.keys(renewalData).forEach(key => {
        body.append(key, renewalData[key]);
      });
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(renewalData);
    }

    const res = await fetch(`${API_BASE}/subscriptions/renew`, {
      method: "POST",
      headers,
      body,
    });

    const data = await res.json();

    if (!res.ok) {
      const message = getErrorMessage(data, lang);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Error renewing subscription:", error);
    throw error;
  }
};

// Get payment proof image
export const getPaymentProof = async (filename) => {
  try {
    const res = await fetch(`${API_BASE}/auth/payment-proofs/${filename}`, {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
    });

    if (!res.ok) {
      throw new Error("Payment proof not found");
    }

    return res.blob();
  } catch (error) {
    console.error("Error fetching payment proof:", error);
    throw error;
  }
};

export const getSubscriptionStatus = async (token, courseId, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/subscriptions/status/${courseId}`, {
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
    console.error("Error getting subscription status:", error);
    throw error;
  }
};

export const getExpiredSubscriptions = async (token, lang = 'ar') => {
  try {
    const res = await fetch(`${API_BASE}/expired-subscriptions`, {
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
    console.error("Error fetching expired subscriptions:", error);
    throw error;
  }
};

// Admin Subscription API Functions
export const getAllSubscriptions = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/admin/subscriptions/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    throw error;
  }
};

export const getPendingSubscriptions = async (token, page = 1) => {
  try {
    const res = await fetch(
      `${API_BASE}/admin/subscriptions/pending?page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching pending subscriptions:", error);
    throw error;
  }
};

export const approveSubscription = async (token, subscriptionId) => {
  try {
    const res = await fetch(
      `${API_BASE}/admin/subscriptions/${subscriptionId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error approving subscription:", error);
    throw error;
  }
};

// Note: The original code had two identical functions with the same name.
// The second one has been modified to include admin_notes, and the first one
// has been kept as is. If this is not the intended behavior, please clarify.
export const rejectSubscription = async (token, subscriptionId, adminNotes) => {
  try {
    const res = await fetch(
      `${API_BASE}/admin/subscriptions/${subscriptionId}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error rejecting subscription:", error);
    throw error;
  }
};

// Admin subscription functions with admin_notes
export const approveSubscriptionWithNotes = async (token, subscriptionId, adminNotes = '') => {
  try {
    const res = await fetch(
      `${API_BASE}/admin/subscriptions/${subscriptionId}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error approving subscription:", error);
    throw error;
  }
};

// Alternative endpoints (POST methods)
export const approveSubscriptionAlt = async (token, subscriptionId, adminNotes = '') => {
  try {
    const res = await fetch(
      `${API_BASE}/subscriptions/${subscriptionId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error approving subscription (alt):", error);
    throw error;
  }
};

export const rejectSubscriptionAlt = async (token, subscriptionId, adminNotes) => {
  try {
    const res = await fetch(
      `${API_BASE}/subscriptions/${subscriptionId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error rejecting subscription (alt):", error);
    throw error;
  }
};

// Get all subscriptions with search and filters (alternative endpoint)
export const getAllSubscriptionsWithFilters = async (token, search = '', status = '') => {
  try {
    let url = `${API_BASE}/subscriptions`;
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching filtered subscriptions:", error);
    throw error;
  }
};

// View payment proof directly (for admins)
export const viewPaymentProofDirect = async (filename) => {
  try {
    const url = `${API_BASE.replace('/api', '')}/uploads/payment_proofs/${filename}`;
    return url;
  } catch (error) {
    console.error("Error constructing payment proof URL:", error);
    throw error;
  }
};

// Enhanced payment proof access with authentication
export const getPaymentProofWithAuth = async (token, filename) => {
  try {
    const res = await fetch(`${API_BASE}/auth/payment-proofs/${filename}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/*",
      },
    });

    if (!res.ok) {
      throw new Error("Payment proof not found");
    }

    return res.blob();
  } catch (error) {
    console.error("Error fetching authenticated payment proof:", error);
    throw error;
  }
};

// New function to get the count of pending subscriptions
export const getPendingSubscriptionsCount = async (token) => {
  try {
    // Assuming the API endpoint for pending subscriptions also returns a count or total
    // If the endpoint /admin/subscriptions/pending only returns a list, you might need a separate endpoint for the count.
    // For now, we'll assume it returns a structure with a total count.
    const response = await fetch(
      `${API_BASE}/admin/subscriptions/pending`, // Using the same endpoint as getPendingSubscriptions, assuming it returns total count
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pending subscriptions count");
    }

    const data = await response.json();
    // Adjust this based on the actual response structure from your API
    // For example, if the response is { data: { subscriptions: [...], total: 10 } }, use data.data.total
    // If the response is { pending_count: 10 }, use data.pending_count
    // Assuming a structure like { data: { total: ... } } or similar
    return data?.data?.total || 0;
  } catch (error) {
    console.error("Error fetching pending subscriptions count:", error);
    return 0; // Return 0 in case of error
  }
};