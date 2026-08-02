import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import { updateAdminCourse } from "../../../api/courses";
import { useAuth } from "../../../context/AuthContext";
import i18n from "../../../i18n";

function UpdateCourse({ course, onCourseUpdated, isOpen, onClose }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    is_active: "true",
    grade: "",
    image: null,
    intro_video_url: "",
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        price: course.price || "",
        is_active: course.is_active ? "true" : "false",
        grade: course.grade || "",
        image: null,
        intro_video_url: course.intro_video_url || "",
      });
    }
  }, [course]);

  const validateYouTubeUrl = (url) => {
    if (!url || url.trim() === '') return true; // Empty is valid (optional field)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({
        ...prev,
        image: files[0] || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push(t("adminDashboard.updateCourse.validation.titleRequired"));
    }
    
    if (!formData.description.trim()) {
      errors.push(t("adminDashboard.updateCourse.validation.descriptionRequired"));
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      errors.push(t("adminDashboard.updateCourse.validation.priceRequired"));
    }
    
    if (!formData.grade) {
      errors.push(t("adminDashboard.updateCourse.validation.gradeRequired"));
    }
    
    if (formData.intro_video_url && !validateYouTubeUrl(formData.intro_video_url)) {
      errors.push("رجاءً أدخل رابط YouTube صحيح للفيديو التعريفي");
    }
    
    return errors;
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Token in UpdateCourse:", token ? "Token exists" : "No token");

    if (!token) {
      setIsLoading(false);
      setError(t("adminDashboard.updateCourse.unauthenticated") || "Authentication required");
      return;
    }

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      setIsLoading(false);
      return;
    }

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        grade: formData.grade,
        image: formData.image,
        is_active: formData.is_active === "true" ? 1 : 0,
        intro_video_url: formData.intro_video_url.trim() || null,
      };

      const response = await updateAdminCourse(course.id, courseData, token, i18n.language);

      // Show success message
      const successMessage = response.successMessage || 
                           t("adminDashboard.coursesManager.updateSuccess");
      
      // Use a more user-friendly notification instead of alert
      if (window.showToast) {
        window.showToast(successMessage, 'success');
      } else {
        alert(successMessage);
      }

      onClose();
      if (onCourseUpdated) {
        onCourseUpdated(response.data);
      }
    } catch (err) {
      console.error("Course update error:", err);
      setError(err.message || t("adminDashboard.updateCourse.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            {t("adminDashboard.updateCourse.title")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdateCourse}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Course Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.courseTitle")} *
              </label>
              <input
                type="text"
                name="title"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.updateCourse.courseTitlePlaceholder"
                )}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.description")} *
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.updateCourse.descriptionPlaceholder"
                )}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.price")} *
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.price}
                onChange={handleInputChange}
                required
                placeholder={t("adminDashboard.updateCourse.pricePlaceholder")}
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.grade")}
              </label>
              <select
                name="grade"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.grade}
                onChange={handleInputChange}
                required
              >
                <option value="">
                  {t("adminDashboard.updateCourse.selectGrade")}
                </option>
                <option value="الاول">
                  {t("adminDashboard.updateCourse.firstGrade")}
                </option>
                <option value="الثاني">
                  {t("adminDashboard.updateCourse.secondGrade")}
                </option>
                <option value="الثالث">
                  {t("adminDashboard.updateCourse.thirdGrade")}
                </option>
              </select>
            </div>

            {/* Is Active */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.status")}
              </label>
              <select
                name="is_active"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.is_active}
                onChange={handleInputChange}
              >
                <option value="true">
                  {t("adminDashboard.updateCourse.active")}
                </option>
                <option value="false">
                  {t("adminDashboard.updateCourse.inactive")}
                </option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.courseImage")}
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={handleInputChange}
              />
              {formData.image && (
                <p className="mt-2 text-sm text-gray-400">
                  {t("adminDashboard.updateCourse.selectedFile", {
                    filename: formData.image.name,
                  })}
                </p>
              )}
              {course.image_url && !formData.image && (
                <p className="mt-2 text-sm text-gray-400">
                  {t("adminDashboard.updateCourse.currentImage", {
                    filename: course.image_url,
                  })}
                </p>
              )}
            </div>

            {/* Intro Video URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateCourse.introVideoUrl")}
              </label>
              <input
                type="url"
                name="intro_video_url"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.intro_video_url}
                onChange={handleInputChange}
                placeholder={t("adminDashboard.updateCourse.introVideoUrlPlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-400">
                {t("adminDashboard.updateCourse.introVideoUrlHint")}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("adminDashboard.updateCourse.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading
                ? t("adminDashboard.updateCourse.updating")
                : t("adminDashboard.updateCourse.updateCourse")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateCourse;
