import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiVideo, FiUpload, FiTrash2, FiCheck } from "react-icons/fi";
import {
  updateLesson,
  uploadLessonVideo,
  deleteLessonVideo,
} from "../../../api/lessons";
import { useAuth } from "../../../context/AuthContext";

function UpdateLesson({
  lesson,
  onLessonUpdated,
  isOpen,
  onClose,
  courses = [],
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
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

  useEffect(() => {
    if (lesson) {
      setFormData({
        course_id: lesson.course_id || "",
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        order: lesson.order || "",
        duration: lesson.duration || "",
        target_gender: lesson.target_gender || "both",
        is_free: lesson.is_free || false,
      });
    }
  }, [lesson]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!token) {
      setIsLoading(false);
      setError(t("adminDashboard.updateLesson.unauthenticated"));
      return;
    }

    try {
      const lessonData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        order: parseInt(formData.order),
        duration: formData.duration,
        target_gender: formData.target_gender,
        is_free: formData.is_free,
      };

      const response = await updateLesson(lesson.id, lessonData, token);

      onClose();
      if (onLessonUpdated) {
        onLessonUpdated(response.data);
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
      setVideoError(t("adminDashboard.updateLesson.invalidVideoFile"));
    }
  };

  const handleVideoUpload = async () => {
    if (!selectedVideo || !lesson || !token) return;

    setIsUploadingVideo(true);
    setVideoError("");
    setVideoSuccess("");

    try {
      await uploadLessonVideo(lesson.id, selectedVideo, token);
      setVideoSuccess(t("adminDashboard.updateLesson.videoUploadSuccess"));
      setSelectedVideo(null);

      // Refresh lesson data
      if (onLessonUpdated) {
        onLessonUpdated({
          ...lesson,
          has_video: true,
          video_status: "processing",
        });
      }
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleVideoDelete = async () => {
    if (!lesson || !token) return;

    setIsDeletingVideo(true);
    setVideoError("");
    setVideoSuccess("");

    try {
      await deleteLessonVideo(lesson.id, token);
      setVideoSuccess(t("adminDashboard.updateLesson.videoDeleteSuccess"));

      // Refresh lesson data
      if (onLessonUpdated) {
        onLessonUpdated({ ...lesson, has_video: false, video_status: null });
      }
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setIsDeletingVideo(false);
    }
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            {t("adminDashboard.updateLesson.title")}
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

        <form id="update-lesson-form" onSubmit={handleUpdateLesson}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Course Selection (Read-only) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.course")}
              </label>
              <select
                name="course_id"
                className="w-full p-3 bg-gray-600 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                value={formData.course_id}
                disabled
              >
                <option value={formData.course_id}>
                  {courses.find((c) => c.id === parseInt(formData.course_id))
                    ?.title || "Loading..."}
                </option>
              </select>
            </div>

            {/* Lesson Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.lessonTitle")} *
              </label>
              <input
                type="text"
                name="title"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.updateLesson.lessonTitlePlaceholder"
                )}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.description")} *
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.updateLesson.descriptionPlaceholder"
                )}
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.content")} *
              </label>
              <textarea
                name="content"
                rows="4"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.content}
                onChange={handleInputChange}
                required
                placeholder={t(
                  "adminDashboard.updateLesson.contentPlaceholder"
                )}
              />
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.order")} *
              </label>
              <input
                type="number"
                name="order"
                min="1"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.order}
                onChange={handleInputChange}
                required
                placeholder={t("adminDashboard.updateLesson.orderPlaceholder")}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.duration")}
              </label>
              <input
                type="text"
                name="duration"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder={t(
                  "adminDashboard.updateLesson.durationPlaceholder"
                )}
              />
            </div>

            {/* Target Gender */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.targetGender")}
              </label>
              <select
                name="target_gender"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.target_gender}
                onChange={handleInputChange}
              >
                <option value="both">
                  {t("adminDashboard.updateLesson.bothGenders")}
                </option>
                <option value="male">
                  {t("adminDashboard.updateLesson.maleOnly")}
                </option>
                <option value="female">
                  {t("adminDashboard.updateLesson.femaleOnly")}
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
                {t("adminDashboard.updateLesson.isFree")}
              </label>
            </div>
          </div>
        </form>

        {/* Video Management Section */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiVideo className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-medium text-white">
              {t("adminDashboard.updateLesson.videoManagement")}
            </h4>
          </div>

          {/* Current Video Status */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h5 className="text-md font-medium text-white mb-3">
              {t("adminDashboard.updateLesson.currentVideoStatus")}
            </h5>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">
                  {t("adminDashboard.updateLesson.hasVideo")}:
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lesson.has_video
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {lesson.has_video
                    ? t("adminDashboard.updateLesson.yes")
                    : t("adminDashboard.updateLesson.no")}
                </span>
              </div>

              {lesson.video_status && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {t("adminDashboard.updateLesson.status")}:
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.video_status === "ready"
                        ? "bg-green-100 text-green-800"
                        : lesson.video_status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {lesson.video_status === "ready"
                      ? t("adminDashboard.updateLesson.ready")
                      : lesson.video_status === "processing"
                      ? t("adminDashboard.updateLesson.processing")
                      : t("adminDashboard.updateLesson.unknown")}
                  </span>
                </div>
              )}

              {lesson.duration_minutes && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {t("adminDashboard.updateLesson.duration")}:
                  </span>
                  <span className="text-white">
                    {lesson.duration_minutes}{" "}
                    {t("adminDashboard.updateLesson.minutes")}
                  </span>
                </div>
              )}
            </div>
          </div>

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

          {/* Upload New Video */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {t("adminDashboard.updateLesson.uploadNewVideo")}
              </label>
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
                        {t("adminDashboard.updateLesson.uploading")}
                      </>
                    ) : (
                      <>
                        <FiUpload className="w-4 h-4" />
                        {t("adminDashboard.updateLesson.uploadVideo")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Delete Video */}
            {lesson.has_video && (
              <div className="pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-md font-medium text-white mb-1">
                      {t("adminDashboard.updateLesson.deleteVideo")}
                    </h5>
                    <p className="text-gray-400 text-sm">
                      {t("adminDashboard.updateLesson.deleteWarning")}
                    </p>
                  </div>
                  <button
                    onClick={handleVideoDelete}
                    disabled={isDeletingVideo}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeletingVideo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("adminDashboard.updateLesson.deleting")}
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="w-4 h-4" />
                        {t("adminDashboard.updateLesson.deleteVideo")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
            onClick={onClose}
            disabled={isLoading || isUploadingVideo || isDeletingVideo}
          >
            {t("adminDashboard.updateLesson.cancel")}
          </button>
          <button
            type="submit"
            form="update-lesson-form"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50"
            disabled={isLoading || isUploadingVideo || isDeletingVideo}
          >
            {isLoading
              ? t("adminDashboard.updateLesson.updating")
              : t("adminDashboard.updateLesson.updateLesson")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateLesson;
