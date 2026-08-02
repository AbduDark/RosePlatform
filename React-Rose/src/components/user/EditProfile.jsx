// components/user/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/auth";
import { useTranslation } from "react-i18next";

const EditProfile = ({ profile: initialProfile, onUpdate }) => {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
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
        image: null,
      });
      setProfileImage(initialProfile.image || null);
    }
  }, [initialProfile]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
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
      // Only allow numbers and limit to 11 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      
      // Validate on change
      const error = validatePhoneNumber(numericValue);
      setPhoneError(error);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t("userProfile.validation.nameRequired"));
      return;
    }
    
    // Validate phone if provided
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
      const currentLang = i18n.language || 'ar';
      const response = await updateProfile(formData, token, currentLang);
      const updatedProfile = response?.data || response;
      
      const successMsg = typeof response.message === 'object' 
        ? response.message[currentLang] || response.message.en || response.message.ar 
        : response.message;
      
      setSuccess(successMsg || t("userProfile.profileUpdated"));
      setEditMode(false);
      if (onUpdate) onUpdate();
      setFormData({
        name: updatedProfile.name || formData.name,
        phone: updatedProfile.phone || formData.phone,
        image: null,
      });
      setProfileImage(updatedProfile.image || null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err.message || t("userProfile.updateError");
      setError(errorMsg);
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
      name: initialProfile.name || "",
      phone: initialProfile.phone || "",
      image: null,
    });
    setProfileImage(initialProfile.image || null);
  };

  if (!editMode) {
    return (
      <div className="mx-auto w-full p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              {t("userProfile.studentProfile")}
            </h2>
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <FaSave
                className={`${i18n.language === "ar" ? "ml-2" : "mr-2"}`}
                size={16}
              />
              {t("userProfile.edit")}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md transition-colors">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md transition-colors">
                {typeof success === 'string' ? success : t("userProfile.profileUpdated")}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("userProfile.name")}
                </p>
                <p className="text-gray-800 dark:text-gray-200 mt-1">{initialProfile?.name || formData.name || "N/A"}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("userProfile.email")}
                </p>
                <p className="text-gray-800 dark:text-gray-200 mt-1">{initialProfile?.email || "N/A"}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("userProfile.phone")}
                </p>
                <p className="text-gray-800 dark:text-gray-200 mt-1">{initialProfile?.phone || formData.phone || "N/A"}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("userProfile.gender")}
                </p>
                <p className="text-gray-800 dark:text-gray-200 mt-1">
                  {initialProfile?.gender === "male" 
                    ? t("userProfile.male") 
                    : initialProfile?.gender === "female" 
                    ? t("userProfile.female") 
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {t("userProfile.editStudentProfile")}
          </h2>
          <button
            onClick={handleCancel}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t("userProfile.cancel")}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {success && (
            <div className="mb-6 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md transition-colors">
              {typeof success === 'string' ? success : t("userProfile.profileUpdated")}
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md transition-colors">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t("userProfile.profilePicture")}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative">
                    <img
                      src={profileImage || "/default-avatar.png"}
                      alt="Profile"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md object-cover"
                    />
                    {profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <FaCloudUploadAlt
                      className={`${
                        i18n.language === "ar" ? "ml-2" : "mr-2"
                      }`}
                      size={16}
                    />
                    {t("userProfile.change")}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("userProfile.name")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("userProfile.phone")}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="01xxxxxxxxx"
                  maxLength="11"
                  className={`w-full px-3 py-2 border ${
                    phoneError 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">{phoneError}</p>
                )}
                {formData.phone && !phoneError && (
                  <p className="mt-1 text-sm text-green-500 dark:text-green-400 flex items-center gap-1">
                    ✓ رقم صحيح
                  </p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
                      {t("userProfile.saving")}
                    </div>
                  ) : (
                    <>
                      <FaSave
                        className={`${
                          i18n.language === "ar" ? "ml-2" : "mr-2"
                        }`}
                        size={16}
                      />
                      {t("userProfile.saveChanges")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
