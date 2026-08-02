import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaClock, FaTimesCircle } from "react-icons/fa";

const SubscriptionStatusModal = ({ isOpen, onClose, status, courseId, onRenew }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getModalContent = () => {
    switch (status) {
      case "expired":
        return {
          icon: <FaExclamationTriangle className="w-16 h-16 text-yellow-500 mb-4" />,
          title: "انتهى الاشتراك",
          message: "الاشتراك الشهري الخاص بك انتهى. يرجى التجديد للمتابعة.",
          actionText: "تجديد الاشتراك",
          actionLink: `/courses/${courseId}/enroll`,
          contactInfo: true,
        };
      case "rejected":
        return {
          icon: <FaTimesCircle className="w-16 h-16 text-red-500 mb-4" />,
          title: "تم رفض الطلب",
          message: "تم رفض طلبك لأن إثبات الدفع غير صالح. يرجى رفع طلب جديد مع إثبات دفع صحيح.",
          actionText: "رفع طلب جديد",
          actionLink: `/courses/${courseId}/enroll`,
          contactInfo: false,
        };
      case "pending":
        return {
          icon: <FaClock className="w-16 h-16 text-blue-500 mb-4" />,
          title: "طلبك قيد المراجعة",
          message: "لم يوافق المسؤول بعد على طلبك. يرجى الانتظار لحين التأكد من معلوماتك والموافقة على طلبك.",
          actionText: null,
          actionLink: null,
          contactInfo: true,
        };
      default:
        return null;
    }
  };

  const content = getModalContent();
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            {content.icon}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {content.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {content.message}
            </p>

            {content.contactInfo && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-full">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  إذا كنت تواجه أي مشكلة، تواصل معنا على:
                </p>
                <a
                  href="tel:01008187344"
                  className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                  dir="ltr"
                >
                  01008187344
                </a>
              </div>
            )}

            <div className="flex flex-col w-full gap-3">
              {content.actionText && onRenew && (
                <button
                  onClick={() => {
                    onClose();
                    onRenew();
                  }}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  {content.actionText}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionStatusModal;
