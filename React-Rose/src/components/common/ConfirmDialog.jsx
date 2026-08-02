import React from "react";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from "react-icons/fi";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "warning", // warning, info, success, danger
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <FiAlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "info":
        return <FiInfo className="w-12 h-12 text-blue-500" />;
      case "success":
        return <FiCheckCircle className="w-12 h-12 text-green-500" />;
      case "danger":
        return <FiAlertTriangle className="w-12 h-12 text-red-500" />;
      default:
        return <FiInfo className="w-12 h-12 text-gray-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700 animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center">
            {getIcon()}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>

          <p className="text-gray-300 text-sm">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {cancelText || t("common.cancel")}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${getButtonColor()}`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t("common.processing") || "جاري المعالجة..."}</span>
              </div>
            ) : (
              confirmText || t("common.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;