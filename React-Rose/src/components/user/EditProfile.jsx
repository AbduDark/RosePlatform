// components/user/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaSave, FaTimes, FaUserCircle, FaGraduationCap } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/auth";
import { useTranslation } from "react-i18next";

const GRADE_OPTIONS = [
  { value: "الاول",  label: "الصف الأول الثانوي  (أولى ثانوي)" },
  { value: "الثاني", label: "الصف الثاني الثانوي (تانية ثانوي)" },
  { value: "الثالث", label: "الصف الثالث الثانوي (تالتة ثانوي)" },
];

const gradeLabel = (val) => GRADE_OPTIONS.find(g => g.value === val)?.label || val || "—";

const EditProfile = ({ profile: initialProfile, onUpdate }) => {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    grade: "",
    image: null,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        name: initialProfile.name || "",
        phone: initialProfile.phone || "",
        grade: initialProfile.grade || "الاول",
        image: null,
      });
      setProfileImage(initialProfile.image_url || initialProfile.image || null);
    }
  }, [initialProfile]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target.result);
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return "";
    if (phone.length !== 11) return "رقم الهاتف يجب أن يتكون من 11 رقم";
    if (!phone.startsWith("01")) return "رقم الهاتف يجب أن يبدأ بـ 01";
    if (!/^\d+$/.test(phone)) return "رقم الهاتف يجب أن يحتوي على أرقام فقط";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      setPhoneError(validatePhoneNumber(numericValue));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("الاسم مطلوب");
      return;
    }
    if (formData.phone) {
      const phoneValidationError = validatePhoneNumber(formData.phone);
      if (phoneValidationError) {
        setPhoneError(phoneValidationError);
        setError(phoneValidationError);
        return;
      }
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const currentLang = i18n.language || "ar";
      const response = await updateProfile(formData, token, currentLang);
      const updatedData = response?.data || response;

      const successMsg =
        typeof response.message === "object"
          ? response.message[currentLang] || response.message.en || response.message.ar
          : response.message;

      setSuccess(successMsg || "تم تحديث البروفايل بنجاح");
      setEditMode(false);
      if (onUpdate) onUpdate();

      setFormData({
        name: updatedData.name || formData.name,
        phone: updatedData.phone || formData.phone,
        grade: updatedData.grade || formData.grade,
        image: null,
      });
      setProfileImage(updatedData.image_url || updatedData.image || profileImage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء التحديث");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setError(null);
    setSuccess(false);
    setFormData({
      name: initialProfile?.name || "",
      phone: initialProfile?.phone || "",
      grade: initialProfile?.grade || "الاول",
      image: null,
    });
    setProfileImage(initialProfile?.image_url || initialProfile?.image || null);
  };

  const genderDisplay = initialProfile?.gender === "male"
    ? "ذكر"
    : initialProfile?.gender === "female"
    ? "أنثى"
    : "—";

  /* ─────────── VIEW MODE ─────────── */
  if (!editMode) {
    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaGraduationCap className="text-primary" />
            الملف الشخصي
          </h2>
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <FiEdit2 size={14} />
            تعديل
          </button>
        </div>

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-green-700 dark:text-green-300 text-sm">
            ✅ {typeof success === "string" ? success : "تم التحديث بنجاح"}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Avatar + Basic Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gradient-to-br from-secondary/5 to-primary/5 dark:from-secondary/10 dark:to-primary/10 rounded-2xl border border-primary/20">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="صورة الملف" className="w-full h-full object-cover" />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-300 dark:text-gray-500" />
            )}
          </div>
          <div className="text-center sm:text-right flex-1">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {initialProfile?.name || "—"}
            </h3>
            <p className="text-sm text-primary font-semibold mt-1">
              {initialProfile?.email || "—"}
            </p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              {gradeLabel(initialProfile?.grade)}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "الاسم الكامل", value: initialProfile?.name },
            { label: "البريد الإلكتروني", value: initialProfile?.email },
            { label: "رقم الهاتف", value: initialProfile?.phone },
            { label: "الجنس", value: genderDisplay },
            { label: "الصف الدراسي", value: gradeLabel(initialProfile?.grade), full: true },
          ].map((field, i) => (
            <div
              key={i}
              className={`p-4 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm ${field.full ? "sm:col-span-2" : ""}`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">{field.label}</p>
              <p className="text-gray-800 dark:text-white font-semibold">
                {field.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─────────── EDIT MODE ─────────── */
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FiEdit2 className="text-primary" />
          تعديل الملف الشخصي
        </h2>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          <FaTimes size={13} />
          إلغاء
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-green-700 dark:text-green-300 text-sm">
          ✅ {typeof success === "string" ? success : "تم التحديث بنجاح"}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-gradient-to-br from-secondary/5 to-primary/5 dark:from-secondary/10 dark:to-primary/10 rounded-2xl border border-primary/20">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="صورة الملف" className="w-full h-full object-cover" />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-300 dark:text-gray-500" />
            )}
            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-primary/40 text-primary text-sm rounded-xl hover:bg-primary/5 transition-all cursor-pointer font-medium">
            <FaCloudUploadAlt size={16} />
            تغيير الصورة
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={loading} />
          </label>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="ادخل اسمك الكامل"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              placeholder="01xxxxxxxxx"
              maxLength="11"
              className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${
                phoneError ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-600"
              }`}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
            {formData.phone && !phoneError && formData.phone.length === 11 && (
              <p className="mt-1 text-xs text-green-500 flex items-center gap-1">✓ رقم صحيح</p>
            )}
          </div>

          {/* Grade - Full Width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              الصف الدراسي
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <FaSave size={15} />
              حفظ التغييرات
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
