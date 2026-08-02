import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  getMySubscriptions,
  cancelSubscription,
  renewSubscription,
} from "../../api/subscriptions";
import { useAuth } from "../../context/AuthContext";
import RenewSubscriptionModal from "./RenewSubscriptionModal";

const MySubscriptions = () => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  
  useEffect(() => {
    if (!token) {
      setError(t("mySubscriptions.error.login"));
      setLoading(false);
      navigate("/auth/login");
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        const currentLang = i18n.language || 'ar';
        const data = await getMySubscriptions(token, currentLang);
        setSubscriptions(data?.data?.subscriptions || []);
      } catch (err) {
        setError(err.message || t("mySubscriptions.error.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [token, navigate, t, i18n.language]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm(t("common.confirm"))) {
      return;
    }

    setActionLoading(subscriptionId);
    setError(null);
    setSuccess(null);
    try {
      const currentLang = i18n.language || 'ar';
      const response = await cancelSubscription(token, subscriptionId, currentLang);
      const successMsg = typeof response.message === 'object' 
        ? response.message[currentLang] || response.message.en || response.message.ar 
        : response.message;
      setSuccess(successMsg || t("mySubscriptions.cancelSuccess"));
      
      setTimeout(() => setSuccess(null), 3000);
      
      const data = await getMySubscriptions(token, currentLang);
      setSubscriptions(data?.data?.subscriptions || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRenewModal = (subscription) => {
    setSelectedSubscription(subscription);
    setShowRenewModal(true);
  };

  const handleRenewSubscription = async (formData) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const currentLang = i18n.language || 'ar';
      const submitData = new FormData();
      submitData.append('subscription_id', selectedSubscription.id);
      submitData.append('vodafone_number', formData.vodafone_number);
      submitData.append('parent_phone', formData.parent_phone);
      if (formData.payment_proof instanceof File) {
        submitData.append('payment_proof', formData.payment_proof);
      }

      const response = await renewSubscription(token, submitData, currentLang);
      setSuccess(t("mySubscriptions.renewSuccess"));
      setShowRenewModal(false);
      setSelectedSubscription(null);

      setTimeout(() => {
        setSuccess(null);
        navigate("/dashboard/subscriptions");
      }, 2000);

      const data = await getMySubscriptions(token, currentLang);
      setSubscriptions(data?.data?.subscriptions || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">
          {t("mySubscriptions.title")}
        </h2>

        {success && (
          <div className="mb-8 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-center transition-colors">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-center transition-colors">
            {error}
            {error.includes("log in") && (
              <Link
                to="/auth/login"
                className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t("auth.login.loginButton")}
              </Link>
            )}
          </div>
        )}

        {loading && !error ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400 transition-all duration-300"></div>
          </div>
        ) : subscriptions.length === 0 && !error ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 font-medium">
              {t("mySubscriptions.noSubscriptions")}.{" "}
              {t("mySubscriptions.explore")}
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 text-sm font-semibold"
            >
              {t("mySubscriptions.explore")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <div
                    className="h-40 w-full rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4"
                    aria-hidden="true"
                  >
                    {sub.course?.image_url ? (
                      <img
                        src={sub.course.image_url}
                        alt={sub.course.title}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-medium">
                        {sub.course?.title || t("cardCourse.error")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sub.course?.title || t("cardCourse.error")}
                    </h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        sub.is_active
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {sub.status
                        ? sub.status.charAt(0).toUpperCase() +
                          sub.status.slice(1)
                        : t("common.error")}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.instructor")}:
                    </span>{" "}
                    {sub.course?.instructor_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.level")}:
                    </span>{" "}
                    {sub.course?.level
                      ? sub.course.level.charAt(0).toUpperCase() +
                        sub.course.level.slice(1)
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.duration")}:
                    </span>{" "}
                    {sub.course?.duration_hours
                      ? `${sub.course.duration_hours} ${t("cardCourse.hours")}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.price")}:
                    </span>{" "}
                    {sub.course?.price ? `$${sub.course.price}` : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.subscribed")}:
                    </span>{" "}
                    {sub.subscribed_at ? formatDate(sub.subscribed_at) : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.expires")}:
                    </span>{" "}
                    {sub.expires_at ? formatDate(sub.expires_at) : "N/A"}
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  {/* View Course Button - Only for approved and not expired */}
                  {sub.status === "approved" && !sub.is_expired && (
                    <Link
                      to={`/courses/${sub.course_id}/lessons`}
                      className="inline-block w-full text-center bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 text-sm font-semibold"
                    >
                      {t("mySubscriptions.viewCourse")}
                    </Link>
                  )}

                  {/* Pending Status Message */}
                  {sub.status === "pending" && (
                    <div className="w-full text-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold">
                      {t("mySubscriptions.pendingApproval") || "قيد المراجعة"}
                    </div>
                  )}

                  {/* Rejected Status Message */}
                  {sub.status === "rejected" && (
                    <div className="w-full text-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-semibold">
                      {t("mySubscriptions.rejectedStatus") || "مرفوض - يرجى تقديم طلب جديد"}
                    </div>
                  )}

                  {/* Expired Status Message */}
                  {(sub.is_expired || sub.status === "expired") && (
                    <div className="w-full text-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold">
                      {t("mySubscriptions.expiredStatus") || "منتهي - يرجى التجديد"}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {/* Renew Button - Only for expired or rejected */}
                    {(sub.is_expired || sub.status === "expired" || sub.status === "rejected") && (
                      <button
                        onClick={() => handleOpenRenewModal(sub)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 transition-all transform hover:scale-105 shadow-md text-sm font-bold"
                      >
                        {t("mySubscriptions.renew")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renew Subscription Modal */}
      <RenewSubscriptionModal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleRenewSubscription}
        loading={actionLoading}
        courseName={selectedSubscription?.course?.title}
      />
    </div>
  );
};

export default MySubscriptions;