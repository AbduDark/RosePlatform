import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  getFavoriteSubscriptions,
  removeFromFavorites,
} from "../../api/favorites";
import { useAuth } from "../../context/AuthContext";
import { FiHeart, FiBook } from "react-icons/fi";
import ConfirmDialog from "../common/ConfirmDialog";

const MyFavorites = () => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, courseId: null });

  useEffect(() => {
    if (!token) {
      setError(t("mySubscriptions.error.login"));
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const currentLang = i18n.language || 'ar';
        const data = await getFavoriteSubscriptions(token, currentLang);
        const subscriptions = data?.data?.subscriptions || data?.data?.favorites || data?.subscriptions || data?.favorites || [];
        setFavorites(subscriptions);
      } catch (err) {
        setError(err.message || t("mySubscriptions.error.fetchFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token, t, i18n.language]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRemoveFromFavorites = async () => {
    const courseId = removeConfirm.courseId;
    setActionLoading(courseId);
    setError(null);
    setSuccess(null);
    try {
      const currentLang = i18n.language || 'ar';
      const response = await removeFromFavorites(token, courseId, currentLang);
      setFavorites(prev => prev.filter(fav => fav.course_id !== courseId));
      setRemoveConfirm({ isOpen: false, courseId: null });
      
      const successMsg = typeof response.message === 'object' 
        ? response.message[currentLang] || response.message.en || response.message.ar 
        : response.message;
      setSuccess(successMsg || t("favorites.removedSuccess"));
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || t("common.error"));
      const currentLang = i18n.language || 'ar';
      const data = await getFavoriteSubscriptions(token, currentLang);
      const subscriptions = data?.data?.subscriptions || data?.data?.favorites || data?.subscriptions || data?.favorites || [];
      setFavorites(subscriptions);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-10">
          <FiHeart className="w-8 h-8 text-red-500 dark:text-red-400 mr-3" />
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {t("favorites.title") || "المفضلات"}
          </h2>
        </div>

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
        ) : favorites.length === 0 && !error ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
            <FiHeart className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 font-medium">
              {t("favorites.noFavorites") || "لا توجد كورسات مفضلة بعد"}
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 text-sm font-semibold"
            >
              {t("mySubscriptions.explore") || "استكشف الدورات"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 relative"
              >
                <button
                  onClick={() => setRemoveConfirm({ isOpen: true, courseId: fav.course_id })}
                  disabled={actionLoading === fav.course_id}
                  className="absolute top-4 right-4 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-600 transition-colors disabled:opacity-50"
                  title={t("favorites.removeFromFavorites") || "إزالة من المفضلة"}
                >
                  <FiHeart className="w-6 h-6 fill-current" />
                </button>

                <div className="mb-4">
                  <div
                    className="h-40 w-full rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4"
                    aria-hidden="true"
                  >
                    {fav.course?.image_url ? (
                      <img
                        src={fav.course.image_url}
                        alt={fav.course.title}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <FiBook className="text-gray-400 text-5xl" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fav.course?.title || t("cardCourse.error")}
                    </h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        fav.is_active
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {fav.status
                        ? fav.status.charAt(0).toUpperCase() +
                          fav.status.slice(1)
                        : t("common.error")}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.instructor")}:
                    </span>{" "}
                    {fav.course?.instructor_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.level")}:
                    </span>{" "}
                    {fav.course?.level
                      ? fav.course.level.charAt(0).toUpperCase() +
                        fav.course.level.slice(1)
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.duration")}:
                    </span>{" "}
                    {fav.course?.duration_hours
                      ? `${fav.course.duration_hours} ${t("cardCourse.hours")}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">
                      {t("mySubscriptions.price")}:
                    </span>{" "}
                    {fav.course?.price ? `$${fav.course.price}` : "N/A"}
                  </p>
                  {fav.subscribed_at && (
                    <p>
                      <span className="font-medium">
                        {t("mySubscriptions.subscribed")}:
                      </span>{" "}
                      {formatDate(fav.subscribed_at)}
                    </p>
                  )}
                  {fav.expires_at && (
                    <p>
                      <span className="font-medium">
                        {t("mySubscriptions.expires")}:
                      </span>{" "}
                      {formatDate(fav.expires_at)}
                    </p>
                  )}
                </div>
                <div className="mt-6 space-y-2">
                  <Link
                    to={`/courses/${fav.course_id}`}
                    className="inline-block w-full text-center bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 text-sm font-semibold"
                  >
                    {t("favorites.viewCourse") || "عرض الكورس"}
                  </Link>
                  {fav.status === "approved" && fav.is_active && (
                    <Link
                      to={`/courses/${fav.course_id}/lessons/`}
                      className="inline-block w-full text-center bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 text-sm font-semibold"
                    >
                      {t("mySubscriptions.viewCourse") || "الدروس"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={removeConfirm.isOpen}
        onClose={() => setRemoveConfirm({ isOpen: false, courseId: null })}
        onConfirm={handleRemoveFromFavorites}
        title={t("favorites.removeFromFavorites") || "إزالة من المفضلة"}
        message={t("favorites.confirmRemove") || "هل تريد إزالة هذا الكورس من المفضلة؟"}
        confirmText={t("common.remove") || "إزالة"}
        cancelText={t("common.cancel")}
        type="warning"
        isLoading={actionLoading === removeConfirm.courseId}
      />
    </div>
  );
};

export default MyFavorites;
