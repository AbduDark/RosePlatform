import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiUpload, FiVideo, FiCheck } from "react-icons/fi";
import { createLesson, uploadLessonVideo } from "../../../api/lessons";
import { useAuth } from "../../../context/AuthContext";

function CreateLesson({ onLessonCreated, isOpen, onClose, courses = [] }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLesson, setCreatedLesson] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoSuccess, setVideoSuccess] = useState("");

  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    content: "",
    order: "",
    duration: "",
    target_gender: "both",
    is_free: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!token) {
      setIsLoading(false);
      setError(t("adminDashboard.createLesson.unauthenticated"));
      return;
    }

    try {
      const lessonData = {
        course_id: parseInt(formData.course_id),
        title: formData.title,
        description: formData.description,
        content: formData.content,
        order: parseInt(formData.order),
        duration: formData.duration,
        target_gender: formData.target_gender,
        is_free: formData.is_free,
      };

      const response = await createLesson(lessonData, token);
      setCreatedLesson(response.data);

      // Don't close modal yet, show video upload option
      if (onLessonCreated) {
        onLessonCreated(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedVideo(file);
      setVideoError("");
    } else {
      setVideoError(t("adminDashboard.createLesson.invalidVideoFile"));
    }
  };

  const handleVideoUpload = async () => {
    if (!selectedVideo || !createdLesson || !token) return;

    setIsUploadingVideo(true);
    setVideoError("");
    setVideoSuccess("");

    try {
      await uploadLessonVideo(createdLesson.id, selectedVideo, token);
      setVideoSuccess(t("adminDashboard.createLesson.videoUploadSuccess"));
      setSelectedVideo(null);
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleClose = () => {
    setFormData({
      course_id: "",
      title: "",
      description: "",
      content: "",
      order: "",
      duration: "",
      target_gender: "both",
      is_free: false,
    });
    setCreatedLesson(null);
    setSelectedVideo(null);
    setVideoError("");
    setVideoSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            {t("adminDashboard.createLesson.title")}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <form id="lesson-form" onSubmit={handleCreateLesson}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Course Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.course")} *
              </label>
              <select
                name="course_id"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.course_id}
                onChange={handleInputChange}
                required
              >
                <option value="">
                  {t("adminDashboard.createLesson.selectCourse")}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.lessonTitle")} *
              </label>
              <input
                type="text"
                name="title"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.createLesson.lessonTitlePlaceholder"
                )}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.description")} *
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.createLesson.descriptionPlaceholder"
                )}
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.content")} *
              </label>
              <textarea
                name="content"
                rows="4"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.content}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.createLesson.contentPlaceholder"
                )}
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.order")} *
              </label>
              <input
                type="number"
                name="order"
                min="1"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.order}
                onChange={handleInputChange}
                required
                placeholder={t("adminDashboard.createLesson.orderPlaceholder")}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.duration")}
              </label>
              <input
                type="text"
                name="duration"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder={t(
                  "adminDashboard.createLesson.durationPlaceholder"
                )}
              />
            </div>

            {/* Target Gender */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.createLesson.targetGender")}
              </label>
              <select
                name="target_gender"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.target_gender}
                onChange={handleInputChange}
              >
                <option value="both">
                  {t("adminDashboard.createLesson.bothGenders")}
                </option>
                <option value="male">
                  {t("adminDashboard.createLesson.maleOnly")}
                </option>
                <option value="female">
                  {t("adminDashboard.createLesson.femaleOnly")}
                </option>
              </select>
            </div>

            {/* Is Free */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_free"
                id="is_free"
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                checked={formData.is_free}
                onChange={handleInputChange}
              />
              <label
                htmlFor="is_free"
                className="ml-2 text-sm font-medium text-gray-300"
              >
                {t("adminDashboard.createLesson.isFree")}
              </label>
            </div>
          </div>
        </form>

        {/* Video Upload Section - Show after lesson creation */}
        {createdLesson && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <FiVideo className="w-5 h-5 text-purple-400" />
              <h4 className="text-lg font-medium text-white">
                {t("adminDashboard.createLesson.uploadVideo")}
              </h4>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              {t("adminDashboard.createLesson.videoUploadDescription")}
            </p>

            {videoSuccess && (
              <div className="mb-4 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-300 flex items-center gap-2">
                <FiCheck className="w-4 h-4" />
                {videoSuccess}
              </div>
            )}

            {videoError && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
                {videoError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {selectedVideo && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiVideo className="w-8 h-8 text-purple-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {selectedVideo.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleVideoUpload}
                      disabled={isUploadingVideo}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploadingVideo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("adminDashboard.createLesson.uploading")}
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4" />
                          {t("adminDashboard.createLesson.uploadVideo")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
            onClick={handleClose}
            disabled={isLoading || isUploadingVideo}
          >
            {createdLesson
              ? t("adminDashboard.createLesson.done")
              : t("adminDashboard.createLesson.cancel")}
          </button>
          {!createdLesson && (
            <button
              type="submit"
              form="lesson-form"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading
                ? t("adminDashboard.createLesson.creating")
                : t("adminDashboard.createLesson.createLesson")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateLesson;
