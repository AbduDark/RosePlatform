import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiBookOpen,
  FiCalendar,
  FiDollarSign,
  FiImage,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import { rejectSubscription } from "../../../api/subscriptions";

/**
 * CardSubscriptions
 * Props:
 *  - subscription: object (subscription data)
 *  - onApprove: fn
 *  - onReject: fn (optional - will be called after successful rejection)
 */
function CardSubscriptions({ subscription, onApprove, onReject }) {
  const { t } = useTranslation();

  const [showProof, setShowProof] = useState(false);
  // const [proofUrl, setProofUrl] = useState(""); // Removed as proofUrl is now derived directly
  // const [directUrl, setDirectUrl] = useState(""); // Removed as directUrl is now derived directly

  const getStatusColor = (status) => {
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

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return t("adminDashboard.cardSubscription.approved");
      case "pending":
        return t("adminDashboard.cardSubscription.pending");
      case "rejected":
        return t("adminDashboard.cardSubscription.rejected");
      default:
        return status;
    }
  };

  const getLevelColor = (level) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return t("adminDashboard.cardSubscription.notSet");
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (!price) return t("adminDashboard.cardSubscription.free");
    const num = parseFloat(price);
    if (Number.isNaN(num)) return price;
    return `$${num.toFixed(2)}`;
  };

  // Get payment proof URL from API response or build it
  const getPaymentProofUrl = () => {
    // First priority: use payment_proof_url from API
    if (subscription.payment_proof_url) {
      return subscription.payment_proof_url;
    }

    // Second priority: use payment_proof_image_url from API
    if (subscription.payment_proof_image_url) {
      return subscription.payment_proof_image_url;
    }

    // Fallback: build URL manually
    if (subscription.payment_proof) {
      const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
      const baseUrl = API_BASE.replace("/api", "");
      return `${baseUrl}/uploads/payment_proofs/${subscription.payment_proof}`;
    }

    return null;
  };

  const proofUrl = getPaymentProofUrl();
  // Direct URL logic needs to be reconsidered based on how payment_proof_url/payment_proof_image_url are structured.
  // For now, we'll use proofUrl as direct if no specific direct URL is provided.
  const directUrl = proofUrl;


  const handleViewProof = () => {
    // const { view, direct } = buildProofUrls(); // Replaced with getPaymentProofUrl()
    // const chosen = view || direct; // Replaced with proofUrl
    const chosen = proofUrl; // Use the derived proofUrl

    if (!chosen) {
      alert(t("adminDashboard.cardSubscription.noPaymentProof") || "لا يوجد إثبات دفع متاح");
      return;
    }
    // setProofUrl(chosen); // Removed as proofUrl is now directly accessible
    // setDirectUrl(direct || chosen); // Removed as directUrl is now directly accessible
    setShowProof(true);
  };

  const isImage = (url) => /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(url);
  const isPdf = (url) => /\.pdf$/i.test(url);

  const handleReject = async () => {
    // Create a custom modal for rejection reason
    const reason = await new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]';
      modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-700">
          <h3 class="text-xl font-semibold text-white mb-4">${t("adminDashboard.subscriptionsManager.rejectNotes")}</h3>
          <textarea
            id="rejection-reason"
            class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[120px] resize-none"
            placeholder="${t("adminDashboard.subscriptionsManager.rejectNotesRequired")}"
          ></textarea>
          <div class="flex justify-end gap-3 mt-4">
            <button
              id="cancel-btn"
              class="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              ${t("common.cancel")}
            </button>
            <button
              id="confirm-btn"
              class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ${t("adminDashboard.cardSubscription.rejectSubscription")}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const textarea = modal.querySelector('#rejection-reason');
      const cancelBtn = modal.querySelector('#cancel-btn');
      const confirmBtn = modal.querySelector('#confirm-btn');

      cancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.removeChild(modal);
        resolve(null);
      };

      confirmBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const value = textarea.value.trim();
        if (!value) {
          textarea.classList.add('border-red-500');
          return;
        }
        document.body.removeChild(modal);
        resolve(value);
      };

      modal.onclick = (e) => {
        if (e.target === modal) {
          e.preventDefault();
          e.stopPropagation();
          document.body.removeChild(modal);
          resolve(null);
        }
      };
    });

    if (!reason) return;

    try {
      await rejectSubscription(localStorage.getItem("token"), subscription.id, reason);
      onReject(); // Refresh the list
    } catch (err) {
      console.error("Error rejecting subscription:", err);
      // You can add error handling here if needed
    }
  };


  return (
    <>
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-gray-600">
        <div className="p-6">
          {/* Header with Course Info */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FiBookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white line-clamp-1">
                  {subscription.course?.title ||
                    t("adminDashboard.cardSubscription.unknownCourse")}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {getStatusText(subscription.status)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(
                      subscription.course?.level
                    )}`}
                  >
                    {subscription.course?.level ||
                      t("adminDashboard.cardSubscription.unknownLevel")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {subscription.status === "pending" && (
                <>
                  <button
                    onClick={onApprove}
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                    title={t("adminDashboard.cardSubscription.approveSubscription")}
                    aria-label={t("adminDashboard.cardSubscription.approveSubscription")}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReject}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title={t("adminDashboard.cardSubscription.rejectSubscription")}
                    aria-label={t("adminDashboard.cardSubscription.rejectSubscription")}
                  >
                    <FiXCircle className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* keep placeholders for edit/delete if needed later (commented) */}
            </div>
          </div>

          {/* Course Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-gray-300">
              <FiDollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {t("adminDashboard.cardSubscription.price")}:{" "}
                {formatPrice(subscription.course?.price)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <FiClock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {t("adminDashboard.cardSubscription.duration")}:{" "}
                {subscription.course?.duration_hours || 0}{" "}
                {t("adminDashboard.cardSubscription.hours")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <FiUser className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {t("adminDashboard.cardSubscription.instructor")}:{" "}
                {subscription.course?.instructor_name ||
                  t("adminDashboard.cardSubscription.unknownInstructor")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {t("adminDashboard.cardSubscription.grade")}:{" "}
                {subscription.course?.grade ||
                  t("adminDashboard.cardSubscription.unknownLevel")}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="border-t border-gray-700 pt-4 mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              {t("adminDashboard.cardSubscription.studentInformation")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <FiUser className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {subscription.user?.name ||
                    t("adminDashboard.cardSubscription.unknownStudent")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <FiMail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {subscription.user?.email ||
                    t("adminDashboard.cardSubscription.noEmail")}
                </span>
              </div>

              {subscription.vodafone_number && (
                <div className="flex items-center gap-2 text-gray-300">
                  <FiPhone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{subscription.vodafone_number}</span>
                </div>
              )}

              {subscription.parent_phone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <FiPhone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {t("adminDashboard.cardSubscription.parent")}:{" "}
                    {subscription.parent_phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof */}
          {(subscription.payment_proof || subscription.payment_proof_image || subscription.payment_proof_url || subscription.payment_proof_image_url) && (
            <div className="border-t border-gray-700 pt-4 mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">
                {t("adminDashboard.cardSubscription.paymentProof")}
              </h4>
              <div className="flex items-center gap-2">
                <FiImage className="w-4 h-4 text-gray-400" />
                <button
                  onClick={handleViewProof}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 hover:bg-blue-400/10 px-2 py-1 rounded transition-colors"
                  aria-label={t("adminDashboard.cardSubscription.viewPaymentProof")}
                >
                  <FiEye className="w-3 h-3" />
                  {t("adminDashboard.cardSubscription.viewPaymentProof")}
                </button>

                {/* direct open (public upload path) */}
                {directUrl && (
                  <button
                    onClick={() => {
                      // const { direct } = buildProofUrls(); // Replaced
                      // const openUrl = direct || `${direct}`; // Replaced
                      const openUrl = directUrl; // Use derived directUrl
                      if (openUrl) window.open(openUrl, "_blank", "noopener");
                      else
                        alert(
                          t("adminDashboard.cardSubscription.noPaymentProof") || "لا يوجد إثبات دفع متاح"
                        );
                    }}
                    className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 hover:bg-green-400/10 px-2 py-1 rounded transition-colors"
                    title="عرض مباشر"
                  >
                    <FiImage className="w-3 h-3" />
                    مباشر
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="border-t border-gray-700 pt-4 mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              {t("adminDashboard.cardSubscription.subscriptionDetails")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {t("adminDashboard.cardSubscription.subscribed")}:{" "}
                  {formatDate(subscription.subscribed_at)}
                </span>
              </div>

              {subscription.expires_at && (
                <div className="flex items-center gap-2 text-gray-300">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {t("adminDashboard.cardSubscription.expires")}:{" "}
                    {formatDate(subscription.expires_at)}
                  </span>
                </div>
              )}

              {subscription.student_info && (
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">
                    {t("adminDashboard.cardSubscription.notes")}:{" "}
                  </span>
                  {subscription.student_info}
                </div>
              )}

              {subscription.admin_notes && (
                <div className="text-sm text-gray-300">
                  <span className="text-gray-400">
                    {t("adminDashboard.cardSubscription.adminNotes")}:{" "}
                  </span>
                  {subscription.admin_notes}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              {subscription.is_active ? (
                <div className="flex items-center gap-1 text-green-400">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {t("adminDashboard.cardSubscription.active")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <FiXCircle className="w-4 h-4" />
                  <span className="text-xs">
                    {t("adminDashboard.cardSubscription.inactive")}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              {t("adminDashboard.cardSubscription.id")}: {subscription.id}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing proof */}
      {showProof && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProof(false)}
        >
          <div
            className="bg-gray-900 rounded-xl shadow-lg max-w-4xl w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProof(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded"
              aria-label={t("adminDashboard.cardSubscription.close")}
            >
              <FiXCircle className="w-5 h-5" />
            </button>

            {/* content */}
            {proofUrl ? (
              <>
                {isImage(proofUrl) ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={proofUrl}
                      alt={t("adminDashboard.cardSubscription.paymentProof")}
                      className="max-h-[70vh] rounded"
                    />
                    <div className="flex items-center gap-2">
                      <a
                        href={proofUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition"
                      >
                        <FiDownload className="w-4 h-4" />
                        {t("adminDashboard.cardSubscription.download")}
                      </a>

                      <a
                        href={directUrl || proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-300 rounded hover:bg-blue-500/20 transition"
                      >
                        {t("adminDashboard.cardSubscription.openInNewTab")}
                      </a>
                    </div>
                  </div>
                ) : isPdf(proofUrl) ? (
                  <div className="flex flex-col gap-3">
                    <iframe
                      src={proofUrl}
                      title="payment-proof"
                      className="w-full h-[70vh] bg-white rounded"
                    />
                    <div className="flex items-center gap-2 justify-center">
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition"
                      >
                        <FiDownload className="w-4 h-4" />
                        {t("adminDashboard.cardSubscription.openInNewTab")}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-300">
                    <p className="mb-3">{t("adminDashboard.cardSubscription.fileNotPreviewable")}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition"
                      >
                        <FiEye className="w-4 h-4" />
                        {t("adminDashboard.cardSubscription.openInNewTab")}
                      </a>
                      <a
                        href={directUrl || proofUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-300 rounded hover:bg-green-600/30 transition"
                      >
                        <FiDownload className="w-4 h-4" />
                        {t("adminDashboard.cardSubscription.download")}
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-300">
                {t("adminDashboard.cardSubscription.noPaymentProof") ||
                  "لا يوجد إثبات دفع متاح"}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CardSubscriptions;