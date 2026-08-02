import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBook, FaClock, FaGraduationCap, FaMoneyCheck, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { getCourseById } from "../../api/courses";
import {
  subscribeToCourse,
  getSubscriptionStatus,
} from "../../api/subscriptions";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import i18next from "i18next";
import ImageNotFound from "../../assets/images/ImageNotFound.png"

function EnrollCourse() {
  const { t } = useTranslation();
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    vodafone_number: "",
    amount: "",
    parent_phone: "",
    student_info: "",
    payment_proof: null,
  });
  const [phoneErrors, setPhoneErrors] = useState({
    vodafone_number: "",
    parent_phone: ""
  });
  
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseAndStatus = async () => {
      try {
        setLoading(true);
        const courseRes = await getCourseById(courseId);
        setCourse(courseRes.data);
        if (token) {
          try {
            const statusRes = await getSubscriptionStatus(token, courseId);
            setSubscriptionStatus(statusRes.data);
          } catch (err) {
            console.log("No subscription found for this course");
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndStatus();
  }, [courseId, token]);

  const validatePhoneNumber = (phone) => {
    if (!phone) return "رقم الهاتف مطلوب";
    if (phone.length !== 11) return "رقم الهاتف يجب أن يتكون من 11 رقم";
    if (!phone.startsWith("01")) return "رقم الهاتف يجب أن يبدأ بـ 01";
    if (!/^\d+$/.test(phone)) return "رقم الهاتف يجب أن يحتوي على أرقام فقط";
    return "";
  };

  if (!course) {
    return;
  }

  const handleEnroll = async () => {
    if (!token) {
      setEnrollError(t("enrollCourse.enrollError"));
      return;
    }

    // Validate phone numbers
    const vodafoneError = validatePhoneNumber(subscriptionData.vodafone_number);
    const parentPhoneError = validatePhoneNumber(subscriptionData.parent_phone);

    if (vodafoneError || parentPhoneError) {
      setPhoneErrors({
        vodafone_number: vodafoneError,
        parent_phone: parentPhoneError
      });
      return;
    }

    // التحقق من وجود البيانات المطلوبة
    if (!subscriptionData.vodafone_number || !subscriptionData.parent_phone || !subscriptionData.payment_proof) {
      setEnrollError("يرجى ملء جميع البيانات المطلوبة وإرفاق إثبات الدفع");
      return;
    }

    setEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(false);

    try {
      const formData = new FormData();
      formData.append("course_id", parseInt(courseId));
      formData.append("vodafone_number", subscriptionData.vodafone_number);
      formData.append("amount", parseFloat(course.price || subscriptionData.amount));
      formData.append("parent_phone", subscriptionData.parent_phone);
      formData.append("student_info", subscriptionData.student_info);
      if (subscriptionData.payment_proof) {
        formData.append("payment_proof", subscriptionData.payment_proof);
      }

      await subscribeToCourse(token, formData);
      setEnrollSuccess(true);
      setShowSubscriptionForm(false);
      
      // إعادة تعيين البيانات
      setSubscriptionData({
        vodafone_number: "",
        amount: "",
        parent_phone: "",
        student_info: "",
        payment_proof: null,
      });
      setPhoneErrors({
        vodafone_number: "",
        parent_phone: ""
      });

      // تحديث حالة الاشتراك
      try {
        const statusRes = await getSubscriptionStatus(token, courseId);
        setSubscriptionStatus(statusRes.data);
      } catch (err) {
        console.log("Error refreshing subscription status");
      }

      // التوجيه إلى صفحة الاشتراكات بعد 2 ثانية
      setTimeout(() => {
        navigate("/student-dashboard/subscriptions");
      }, 2000);
    } catch (error) {
      console.error("Subscription error:", error);
      setEnrollError(
        error.response?.data?.message || error.message || "فشل في الاشتراك. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "vodafone_number" || name === "parent_phone") {
      // Only allow numbers and limit to 11 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setSubscriptionData({
        ...subscriptionData,
        [name]: numericValue,
      });
      
      // Validate on change
      const error = validatePhoneNumber(numericValue);
      setPhoneErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else {
      setSubscriptionData({
        ...subscriptionData,
        [name]: files ? files[0] : value,
      });
    }
  };

  if (loading) {
    return;
  }

  return (
    <div>
      {/* COURSE CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 overflow-hidden mb-6 transition-colors border border-gray-200 dark:border-gray-700">
        <img src={course.image_url || ImageNotFound} alt="Course Thumbnail" className="w-full h-48 object-cover" />
        <div className="p-6 dark:bg-gray-800 transition-colors">
          {enrollError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-r-lg flex items-start gap-3">
              <FaExclamationCircle className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{enrollError}</p>
            </div>
          )}
          {enrollSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-r-lg flex items-start gap-3">
              <FaCheckCircle className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-300 text-sm">
                {t("enrollCourse.enrollSuccess")}
              </p>
            </div>
          )}

          {/* Payment Instructions */}
          {showSubscriptionForm && (
            <div className="mb-6 p-5 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border border-primary/30 dark:border-primary/40 rounded-xl transition-colors">
              <h4 className="font-bold text-primary dark:text-primary-light mb-3 text-lg flex items-center gap-2">
                <FaMoneyCheck className="text-xl" />
                تعليمات الدفع
              </h4>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>يرجى تحويل مبلغ <strong className="text-primary dark:text-primary-light text-xl">{course.price} جنيه</strong> إلى الرقم التالي:</p>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-primary/30 dark:border-primary/40 my-3">
                  <p className="font-bold text-2xl text-primary dark:text-primary-light text-center tracking-wider">01008187344</p>
                </div>
                <p className="text-sm">بعد التحويل، خذ لقطة شاشة للدفع واملأ النموذج التالي:</p>
              </div>
            </div>
          )}

          {/* Subscription Form */}
          {showSubscriptionForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 text-lg">
                {t("enrollCourse.subscriptionDetails")}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الرقم الذي حولت منه *
                  </label>
                  <input
                    type="tel"
                    name="vodafone_number"
                    value={subscriptionData.vodafone_number}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      phoneErrors.vodafone_number 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 transition-all`}
                    placeholder="01xxxxxxxxx"
                    maxLength="11"
                    required
                  />
                  {phoneErrors.vodafone_number && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{phoneErrors.vodafone_number}</p>
                  )}
                  {subscriptionData.vodafone_number && !phoneErrors.vodafone_number && (
                    <p className="mt-1 text-sm text-green-500 dark:text-green-400 flex items-center gap-1">
                      <FaCheckCircle /> رقم صحيح
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("enrollCourse.amount")}
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={course.price || subscriptionData.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100 dark:bg-gray-700 dark:text-gray-100 transition-all cursor-not-allowed"
                    placeholder={t("enrollCourse.amountPlaceholder")}
                    readOnly
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("enrollCourse.parentPhone")} *
                  </label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={subscriptionData.parent_phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      phoneErrors.parent_phone 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 transition-all`}
                    placeholder="01xxxxxxxxx"
                    maxLength="11"
                    required
                  />
                  {phoneErrors.parent_phone && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{phoneErrors.parent_phone}</p>
                  )}
                  {subscriptionData.parent_phone && !phoneErrors.parent_phone && (
                    <p className="mt-1 text-sm text-green-500 dark:text-green-400 flex items-center gap-1">
                      <FaCheckCircle /> رقم صحيح
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("enrollCourse.studentInfo")}
                  </label>
                  <textarea
                    name="student_info"
                    value={subscriptionData.student_info}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("enrollCourse.studentInfoPlaceholder")}
                    rows="3"
                  />
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("enrollCourse.paymentProof")} *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="payment_proof"
                      onChange={handleInputChange}
                      accept="image/*"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 dark:file:bg-primary/20 file:text-primary dark:file:text-primary-light hover:file:bg-primary/20 dark:hover:file:bg-primary/30 transition-all cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t("enrollCourse.paymentProofHint")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showSubscriptionForm && (
            <button
              onClick={handleEnroll}
              disabled={enrolling || phoneErrors.vodafone_number || phoneErrors.parent_phone}
              className="mb-3 w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white py-4 px-6 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              <FaGraduationCap
                className={`${i18next.language === "ar" ? "ml-2" : "mr-2"} text-xl`}
              />
              {enrolling ? t("enrollCourse.processing") : "إرسال الاشتراك"}
            </button>
          )}

          {!subscriptionStatus?.subscription?.is_active ? (
            <button
              onClick={() => setShowSubscriptionForm(!showSubscriptionForm)}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white py-4 px-6 rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              <FaGraduationCap
                className={`${i18next.language === "ar" ? "ml-2" : "mr-2"} text-xl`}
              />
              {showSubscriptionForm ? t("enrollCourse.cancel") : "اشترك الآن"}
            </button>
          ) : null}
        </div>
      </div>

      {/* COURSE DETAILS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 transition-colors border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors">
          {t("enrollCourse.courseIncludes")}
        </h3>
        <ul className="space-y-3">
          <li className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center">
              <FaMoneyCheck
                className={`text-primary dark:text-primary-light transition-colors text-xl ${
                  i18next.language === "ar" ? "ml-3" : "mr-3"
                }`}
              />
              <span className="text-gray-700 dark:text-gray-200 transition-colors font-medium">{t("enrollCourse.price")}</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-bold text-lg transition-colors">{course.price} جنيه</span>
          </li>
          <li className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center">
              <FaBook
                className={`text-primary dark:text-primary-light transition-colors text-xl ${
                  i18next.language === "ar" ? "ml-3" : "mr-3"
                }`}
              />
              <span className="text-gray-700 dark:text-gray-200 transition-colors font-medium">{t("enrollCourse.episodes")}</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-bold text-lg transition-colors">{course.lessons_count}</span>
          </li>
          <li className="flex justify-between items-center py-3 transition-colors">
            <div className="flex items-center">
              <FaClock
                className={`text-primary dark:text-primary-light transition-colors text-xl ${
                  i18next.language === "ar" ? "ml-3" : "mr-3"
                }`}
              />
              <span className="text-gray-700 dark:text-gray-200 transition-colors font-medium">{t("enrollCourse.date")}</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-bold transition-colors">
              {course.created_at.split("T")[0]}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default EnrollCourse;
