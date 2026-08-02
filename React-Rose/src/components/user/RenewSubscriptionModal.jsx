import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { IoReload } from "react-icons/io5";

const RenewSubscriptionModal = ({ isOpen, onClose, onSubmit, loading, courseName }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    vodafone_number: "",
    parent_phone: "",
    payment_proof: null,
  });
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const validatePhone = (phone) => {
    // يجب أن يبدأ بـ 01 ويتكون من 11 رقم
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "payment_proof" && files && files[0]) {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, [name]: value });
      // مسح الخطأ عند الكتابة
      if (errors[name]) {
        setErrors({ ...errors, [name]: "" });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // التحقق من رقم الهاتف الذي حولت منه
    if (!formData.vodafone_number) {
      newErrors.vodafone_number = t("validation.phoneRequired") || "رقم الهاتف مطلوب";
    } else if (!validatePhone(formData.vodafone_number)) {
      newErrors.vodafone_number = t("validation.invalidPhone") || "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم";
    }

    // التحقق من رقم ولي الأمر
    if (!formData.parent_phone) {
      newErrors.parent_phone = t("validation.parentPhoneRequired") || "رقم ولي الأمر مطلوب";
    } else if (!validatePhone(formData.parent_phone)) {
      newErrors.parent_phone = t("validation.invalidPhone") || "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم";
    }

    // التحقق من إثبات الدفع
    if (!formData.payment_proof) {
      newErrors.payment_proof = t("validation.paymentProofRequired") || "إثبات الدفع مطلوب";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      vodafone_number: "",
      parent_phone: "",
      payment_proof: null,
    });
    setErrors({});
    setPreviewImage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${
                i18n.language === "ar" ? "text-right" : "text-left"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IoReload className="w-6 h-6 animate-spin-slow" />
                  <h3 className="text-xl font-bold">
                    {t("mySubscriptions.renewForm")}
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Course Name */}
              {courseName && (
                <div className="px-6 pt-4 pb-2">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("enrollCourse.courseIncludes")}
                    </p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {courseName}
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* الرقم الذي حولت منه */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t("enrollCourse.transferPhoneNumber") || "الرقم الذي حولت منه"}
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <input
                    type="tel"
                    name="vodafone_number"
                    value={formData.vodafone_number}
                    onChange={handleInputChange}
                    maxLength="11"
                    placeholder="01xxxxxxxxx"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all
                      ${
                        errors.vodafone_number
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                      }`}
                  />
                  {errors.vodafone_number && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <FaExclamationCircle className="w-4 h-4" />
                      {errors.vodafone_number}
                    </motion.p>
                  )}
                  {formData.vodafone_number && validatePhone(formData.vodafone_number) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <FaCheckCircle className="w-4 h-4" />
                      {t("validation.validPhone") || "رقم صحيح"}
                    </motion.p>
                  )}
                </div>

                {/* رقم ولي الأمر */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t("enrollCourse.parentPhone")}
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleInputChange}
                    maxLength="11"
                    placeholder="01xxxxxxxxx"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all
                      ${
                        errors.parent_phone
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                      }`}
                  />
                  {errors.parent_phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <FaExclamationCircle className="w-4 h-4" />
                      {errors.parent_phone}
                    </motion.p>
                  )}
                  {formData.parent_phone && validatePhone(formData.parent_phone) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <FaCheckCircle className="w-4 h-4" />
                      {t("validation.validPhone") || "رقم صحيح"}
                    </motion.p>
                  )}
                </div>

                {/* إثبات الدفع */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t("enrollCourse.paymentProof")}
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="payment_proof"
                      onChange={handleInputChange}
                      accept="image/*"
                      className={`w-full px-4 py-3 border-2 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all cursor-pointer
                        file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                        file:bg-indigo-100 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-200 
                        hover:file:bg-indigo-200 dark:hover:file:bg-indigo-800
                        ${
                          errors.payment_proof
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                    />
                  </div>
                  {errors.payment_proof && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <FaExclamationCircle className="w-4 h-4" />
                      {errors.payment_proof}
                    </motion.p>
                  )}
                  {previewImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 rounded-lg overflow-hidden border-2 border-green-200 dark:border-green-800"
                    >
                      <img
                        src={previewImage}
                        alt="Payment proof preview"
                        className="w-full h-48 object-cover"
                      />
                      <p className="text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/30 text-center">
                        {formData.payment_proof.name}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Buttons */}
                <div className={`flex gap-3 pt-4 ${i18n.language === "ar" ? "flex-row-reverse" : ""}`}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t("enrollCourse.processing")}
                      </span>
                    ) : (
                      t("mySubscriptions.confirmRenew")
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 bg-gray-400 dark:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-500 dark:hover:bg-gray-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RenewSubscriptionModal;
