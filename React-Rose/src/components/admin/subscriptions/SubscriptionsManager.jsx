import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiUsers,
} from "react-icons/fi";
import {
  getAllSubscriptions,
  getPendingSubscriptions,
  approveSubscription,
  rejectSubscription,
} from "../../../api/subscriptions";
import CreateSubscriptions from "./CreateSubscriptions";
import UpdateSubscriptions from "./UpdateSubscriptions";
import DeleteSubscriptions from "./DeleteSubscriptions";
import SearchSubscriptions from "./SearchSubscriptions";
import CardSubscriptions from "./CardSubscriptions";
import Pagination from "../../common/Pagination";

const SubscriptionsManager = () => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [viewMode, setViewMode] = useState("all"); // "all" or "pending"

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, viewMode]);

  // Filter subscriptions when search term or filters change
  useEffect(() => {
    const filtered = subscriptions.filter((subscription) => {
      const matchesSearch =
        subscription.user?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        subscription.user?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        subscription.course?.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (subscription.vodafone_number &&
          subscription.vodafone_number.includes(searchTerm));

      const matchesStatus =
        selectedStatus === "all" || subscription.status === selectedStatus;
      const matchesCourse =
        selectedCourse === "all" ||
        subscription.course?.id?.toString() === selectedCourse;

      return matchesSearch && matchesStatus && matchesCourse;
    });
    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, selectedStatus, selectedCourse]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      let response;

      if (viewMode === "pending") {
        response = await getPendingSubscriptions(
          localStorage.getItem("token"),
          currentPage
        );
        const pendingData = response?.data?.data || response?.data || [];
        setSubscriptions(Array.isArray(pendingData) ? pendingData : []);
        setTotalPages(response?.data?.last_page || 1);
        setTotalSubscriptions(response?.data?.total || 0);
      } else {
        response = await getAllSubscriptions(localStorage.getItem("token"));
        const allData = response?.data?.subscriptions || response?.data || [];
        setSubscriptions(Array.isArray(allData) ? allData : []);
        setTotalPages(1);
        setTotalSubscriptions(Array.isArray(allData) ? allData.length : 0);
      }

      setError("");
    } catch (err) {
      setError(
        t("adminDashboard.subscriptionsManager.failedToFetch") +
          ": " +
          err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subscription approval
  const handleApproveSubscription = async (subscriptionId) => {
    try {
      await approveSubscription(localStorage.getItem("token"), subscriptionId);
      // Refresh the list
      fetchSubscriptions();
    } catch (err) {
      setError(
        t("adminDashboard.subscriptionsManager.approveError") +
          ": " +
          err.message
      );
    }
  };

  // Handle subscription rejection
  const handleRejectSubscription = async (subscriptionId) => {
    // This will be handled in CardSubscriptions component
    // which already has the custom modal implementation
  };

  // Handle subscription creation
  const handleSubscriptionCreated = (newSubscription) => {
    setSubscriptions((prev) => [...prev, newSubscription]);
    setIsCreateModalOpen(false);
  };

  // Handle subscription update
  const handleSubscriptionUpdated = (updatedSubscription) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === updatedSubscription.id ? updatedSubscription : sub
      )
    );
    setIsEditModalOpen(false);
    setCurrentSubscription(null);
  };

  // Handle subscription deletion
  const handleSubscriptionDeleted = (subscriptionId) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId));
    setIsDeleteModalOpen(false);
    setSubscriptionToDelete(null);
  };

  

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Get unique courses for filter
  const uniqueCourses = [
    ...new Set(subscriptions.map((sub) => sub.course?.id)),
  ].map((id) => {
    const sub = subscriptions.find((s) => s.course?.id === id);
    return { id, title: sub?.course?.title };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">
          {t("adminDashboard.subscriptionsManager.loadingSubscriptions")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("adminDashboard.subscriptionsManager.title")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {t(
                "adminDashboard.subscriptionsManager.allSubscriptions"
              ).toLowerCase()}
              {" "} {totalSubscriptions}
            </div>
            {/* <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <FiPlus className="w-4 h-4" />
              {t("adminDashboard.subscriptionsManager.createSubscription")}
            </button> */}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => handleViewModeChange("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t("adminDashboard.subscriptionsManager.allSubscriptions")}
          </button>
          <button
            onClick={() => handleViewModeChange("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t("adminDashboard.subscriptionsManager.pendingSubscriptions")}
          </button>
        </div>

        {/* Search and Filters */}
        <SearchSubscriptions
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          uniqueCourses={uniqueCourses}
        />
      </div>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {t("adminDashboard.subscriptionsManager.noSubscriptionsFound")}
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedStatus !== "all" || selectedCourse !== "all"
              ? t("adminDashboard.searchSubscription.noResults")
              : t("adminDashboard.subscriptionsManager.createSubscription")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => (
            <CardSubscriptions
              key={subscription.id}
              subscription={subscription}
              onApprove={() => handleApproveSubscription(subscription.id)}
              onReject={fetchSubscriptions}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          setPage={handlePageChange}
          pageCount={totalPages}
          totalItems={totalSubscriptions}
          itemsPerPage={10}
        />
      )}

      {/* Create Subscription Modal */}
      <CreateSubscriptions
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubscriptionCreated={handleSubscriptionCreated}
      />

      {/* Edit Subscription Modal */}
      <UpdateSubscriptions
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subscription={currentSubscription}
        onSubscriptionUpdated={handleSubscriptionUpdated}
      />

      {/* Delete Subscription Modal */}
      <DeleteSubscriptions
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        subscription={subscriptionToDelete}
        onSubscriptionDeleted={handleSubscriptionDeleted}
      />
    </div>
  );
};

export default SubscriptionsManager;
