import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiBell, FiUsers, FiBarChart2, FiEye, FiTrash2 } from "react-icons/fi";
import { getNotificationsStatistics, getAllNotifications } from "../../../api/notifications";
import CreateNotification from "./Createnotifications";
import Pagination from "../../common/Pagination";
import ConfirmDialog from "../../common/ConfirmDialog";

const NotificationsManager = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, notificationId: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showNotificationsList) {
      fetchNotifications();
    }
  }, [currentPage, showNotificationsList, filterUnread]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const statsResponse = await getNotificationsStatistics();
      console.log("Notifications stats API response:", statsResponse);

      if (!statsResponse) {
        // Token was invalid and user was redirected
        return;
      }

      // Check if response indicates failure
      if (statsResponse.success === false) {
        throw new Error(statsResponse.message?.en || statsResponse.message || "Failed to fetch notifications statistics");
      }

      // Handle different response formats
      let statsData = null;

      if (statsResponse && statsResponse.success !== false) {
        if (statsResponse.data) {
          statsData = statsResponse.data;
        } else {
          statsData = statsResponse;
        }
      }

      console.log("Processed notifications stats:", statsData);

      if (statsData && typeof statsData === 'object') {
        // Ensure all required fields exist with default values
        const normalizedStats = {
          total_notifications: statsData.total_notifications || 0,
          today_notifications: statsData.today_notifications || 0,
          read_notifications: statsData.read_notifications || 0,
          unread_notifications: statsData.unread_notifications || 0,
          this_week_notifications: statsData.this_week_notifications || 0,
          this_month_notifications: statsData.this_month_notifications || 0,
          read_percentage: statsData.read_percentage || 0
        };

        console.log("Normalized notifications stats:", normalizedStats);
        setStatistics(normalizedStats);
        setError("");
      } else {
        throw new Error("No statistics data received from API");
      }
    } catch (err) {
      console.error("Notifications stats error:", err);
      setError(
        t("adminDashboard.notificationsManager.failedToFetch") +
          ": " +
          err.message
      );

      // Set default stats to prevent crashes
      setStatistics({
        total_notifications: 0,
        today_notifications: 0,
        read_notifications: 0,
        unread_notifications: 0,
        this_week_notifications: 0,
        this_month_notifications: 0,
        read_percentage: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        per_page: '15',
        page: currentPage.toString(),
        unread_only: filterUnread ? 'true' : 'false'
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE}/notifications?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      console.log("Notifications list response:", data);

      if (data?.data) {
        const notificationsList = data.data.data || data.data || [];
        setNotifications(Array.isArray(notificationsList) ? notificationsList : []);

        const lastPage = data.data.last_page || data.meta?.last_page || 1;
        setTotalPages(lastPage);
        setError("");
      } else {
        setNotifications([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching notifications list:", err);
      setError(t("adminDashboard.notificationsManager.failedToFetch") + ": " + err.message);
      setNotifications([]);
      setTotalPages(1);
    }
  };

  const handleNotificationSent = () => {
    setIsCreateModalOpen(false);
    fetchData();
    if (showNotificationsList) {
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/${deleteConfirm.notificationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      // إعادة جلب البيانات
      await fetchData();
      if (showNotificationsList) {
        await fetchNotifications();
      }
      
      // إرسال حدث لتحديث العداد في AdminPage
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      
      setDeleteConfirm({ isOpen: false, notificationId: null });
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError(t("notifications.errorDeleting"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      // إعادة جلب البيانات
      await fetchData();
      if (showNotificationsList) {
        setCurrentPage(1); // العودة للصفحة الأولى
        await fetchNotifications();
      }
      
      // إرسال حدث لتحديث العداد في AdminPage
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch (err) {
      console.error("Error marking all as read:", err);
      setError(t("notifications.errorMarkingAsRead") || "فشل في تحديد الإشعارات كمقروءة");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">
          {t("adminDashboard.notificationsManager.loadingNotifications")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between  md:flex-row flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("adminDashboard.notificationsManager.title")}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center mt-4 md:mt-0 gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <FiPlus className="w-4 h-4" />
              {t("adminDashboard.notificationsManager.sendNotification")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.totalNotifications"
                    )}
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.total_notifications}
                  </p>
                </div>
                <FiBell className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.sentToday"
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statistics.today_notifications}</p>
                </div>
                <FiBarChart2 className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.readNotifications"
                    )}
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.read_notifications}
                    {` `}
                    ({isNaN(statistics.read_percentage) ? 0 : Math.ceil(statistics.read_percentage)}%)
                  </p>
                </div>
                <FiUsers className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.unreadNotifications"
                    )}
                  </p>
                  <p className="text-2xl font-bold">
                    {statistics.unread_notifications}
                  </p>
                </div>
                <FiBell className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.sentWeek"
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statistics.this_week_notifications}</p>
                </div>
                <FiBarChart2 className="w-8 h-8 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">
                    {t(
                      "adminDashboard.notificationsManager.statistics.sentMonth"
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statistics.this_month_notifications}</p>
                </div>
                <FiBarChart2 className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List Section */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 className="text-xl font-bold text-white">
            {t("adminDashboard.notificationsManager.notificationsList") || "قائمة الإشعارات"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotificationsList(!showNotificationsList)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              <FiEye className="w-4 h-4" />
              {showNotificationsList ? t("common.hide") || "إخفاء" : t("common.show") || "عرض"}
            </button>
          </div>
        </div>

        {showNotificationsList && (
          <>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterUnread(!filterUnread)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    filterUnread 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FiBell className="w-4 h-4" />
                  {filterUnread ? t("notifications.showAll") || "عرض الكل" : t("notifications.showUnread") || "عرض غير المقروءة"}
                </button>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {markAllLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("common.loading") || "جاري التحميل..."}
                  </>
                ) : (
                  <>
                    <FiBell className="w-4 h-4" />
                    {t("notifications.markAllAsRead") || "تحديد الكل كمقروء"}
                  </>
                )}
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <FiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {filterUnread 
                    ? (t("notifications.noUnreadNotifications") || "لا توجد إشعارات غير مقروءة") 
                    : (t("adminDashboard.notificationsManager.noNotifications") || "لا توجد إشعارات")
                  }
                </h3>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'success' ? 'bg-green-500/20' :
                          notification.type === 'warning' ? 'bg-yellow-500/20' :
                          notification.type === 'error' ? 'bg-red-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          <FiBell className={`w-5 h-5 ${
                            notification.type === 'success' ? 'text-green-400' :
                            notification.type === 'warning' ? 'text-yellow-400' :
                            notification.type === 'error' ? 'text-red-400' :
                            'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">
                            {notification.title?.ar || notification.title?.en || notification.title}
                          </h4>
                          <p className="text-gray-300 text-sm mb-2">
                            {notification.message?.ar || notification.message?.en || notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-3 h-3" />
                              {notification.user?.name || t("common.user")}
                            </span>
                            <span>
                              {formatDate(notification.created_at)}
                            </span>
                            {notification.is_read && (
                              <span className="text-green-400">
                                {t("notifications.markAsRead")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, notificationId: notification.id })}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title={t("notifications.delete")}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  page={currentPage}
                  setPage={setCurrentPage}
                  pageCount={totalPages}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Notification Modal */}
      <CreateNotification
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onNotificationSent={handleNotificationSent}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, notificationId: null })}
        onConfirm={handleDeleteNotification}
        title={t("notifications.delete")}
        message={t("notifications.confirmDelete") || "هل أنت متأكد من حذف هذا الإشعار؟"}
        confirmText={t("common.delete") || "حذف"}
        cancelText={t("common.cancel")}
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default NotificationsManager;