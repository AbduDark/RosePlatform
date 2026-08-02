
// Subscription helper functions
export const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getLevelColor = (level) => {
  switch (level) {
    case "beginner":
      return "bg-blue-100 text-blue-800";
    case "intermediate":
      return "bg-purple-100 text-purple-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const formatDate = (dateString, t) => {
  if (!dateString) return t("adminDashboard.cardSubscription.notSet");
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatPrice = (price, t) => {
  if (!price || price === 0) return t("adminDashboard.cardSubscription.free");
  return `$${parseFloat(price).toFixed(2)}`;
};

// Enhanced payment proof URL generation
export const getPaymentProofUrl = (subscription, baseUrl) => {
  if (subscription.payment_proof_image) {
    return subscription.payment_proof_image;
  }
  
  if (subscription.payment_proof) {
    // Try authenticated endpoint first
    return `${baseUrl}/auth/payment-proofs/${subscription.payment_proof}`;
  }
  
  return null;
};

export const getDirectPaymentProofUrl = (subscription, baseUrl) => {
  if (subscription.payment_proof) {
    return `${baseUrl.replace('/api', '')}/uploads/payment_proofs/${subscription.payment_proof}`;
  }
  return null;
};

// Subscription status helpers
export const isSubscriptionExpired = (subscription) => {
  if (!subscription.expires_at) return false;
  return new Date(subscription.expires_at) < new Date();
};

export const getDaysRemaining = (subscription) => {
  if (!subscription.expires_at) return null;
  const now = new Date();
  const expiryDate = new Date(subscription.expires_at);
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Validation helpers
export const validateSubscriptionForm = (formData) => {
  const errors = {};
  
  if (!formData.course_id) {
    errors.course_id = "Course selection is required";
  }
  
  if (!formData.vodafone_number) {
    errors.vodafone_number = "Vodafone number is required";
  } else if (!/^01[0-2]\d{8}$/.test(formData.vodafone_number)) {
    errors.vodafone_number = "Invalid Vodafone number format";
  }
  
  if (!formData.parent_phone) {
    errors.parent_phone = "Parent phone is required";
  } else if (!/^01[0-2]\d{8}$/.test(formData.parent_phone)) {
    errors.parent_phone = "Invalid phone number format";
  }
  
  if (!formData.payment_proof) {
    errors.payment_proof = "Payment proof is required";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// API response helpers
export const handleSubscriptionApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// Subscription filters
export const filterSubscriptions = (subscriptions, filters) => {
  return subscriptions.filter((subscription) => {
    const matchesSearch = !filters.search || 
      subscription.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      subscription.user?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      subscription.course?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      subscription.vodafone_number?.includes(filters.search);

    const matchesStatus = !filters.status || 
      filters.status === "all" || 
      subscription.status === filters.status;
      
    const matchesCourse = !filters.course || 
      filters.course === "all" || 
      subscription.course?.id?.toString() === filters.course;

    return matchesSearch && matchesStatus && matchesCourse;
  });
};
