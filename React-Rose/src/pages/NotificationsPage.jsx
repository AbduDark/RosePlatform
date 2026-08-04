import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notifications";
import { useNotifications } from "../context/NotificationContext";
import { Link } from "react-router-dom";
import Pagination from "../components/common/Pagination";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { unreadCount, resetUnreadCount, decrementUnreadCount } =
    useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllNotifications(currentPage);

      if (response.success) {
        setNotifications(response.data.data);
        setTotalPages(response.data.last_page);
      } else {
        setError(t("notifications.failedToFetch"));
      }
    } catch (error) {
      setError(t("notifications.errorLoading"));
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
      resetUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
      decrementUnreadCount();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      const deletedNotification = notifications.find((n) => n.id === id);
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
      if (deletedNotification && !deletedNotification.is_read) {
        decrementUnreadCount();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return t("notifications.justNow");
    if (diffInMinutes < 60)
      return `${diffInMinutes}${t("notifications.minutesAgo")}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}${t("notifications.hoursAgo")}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}${t("notifications.daysAgo")}`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "course":
        return "📚";
      case "lesson":
        return "🎥";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 dark:border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {t("notifications.loadingNotifications")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("notifications.title")}
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-primary text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-primary hover:text-secondary transition-colors font-bold text-sm"
                >
                  {t("notifications.markAllAsRead")}
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🔔</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t("notifications.noNotifications")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("notifications.noNotificationsDescription")}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/60 ${
                    !notification.is_read ? "bg-primary/5 dark:bg-primary/10 border-s-4 border-primary" : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/15 text-primary rounded-xl flex items-center justify-center text-xl shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.course && (
                            <p className="text-xs font-semibold text-primary mt-1.5">
                              {t("notifications.course")}:{" "}
                              {notification.course.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>

                        {!notification.is_read && (
                          <span className="inline-block w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-primary hover:underline transition-all"
                          >
                            {t("notifications.markAsRead")}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="text-red-500 hover:text-red-700 transition-all"
                        >
                          {t("notifications.delete")}
                        </button>
                        {notification.data?.url && (
                          <Link
                            to={notification.data.url}
                            className="text-secondary hover:underline transition-all"
                          >
                            {t("notifications.viewDetails")}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                page={currentPage}
                setPage={setCurrentPage}
                pageCount={totalPages}
                totalItems={notifications.length}
                itemsPerPage={10}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
