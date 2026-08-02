import React from "react";
import { useTranslation } from "react-i18next";
import {
  FiBook,
  FiClock,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiVideo,
  FiUpload,
} from "react-icons/fi";
// import ImageNotFound from "../../assets/images/ImageNotFound.png";
function CardLesson({ lesson, onEdit, onDelete, onVideoManage }) {
  const { t } = useTranslation();

  const getGenderColor = (gender) => {
    switch (gender) {
      case "male":
        return "bg-blue-100 text-blue-800";
      case "female":
        return "bg-pink-100 text-pink-800";
      case "both":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case "male":
        return t("adminDashboard.cardLesson.maleOnly");
      case "female":
        return t("adminDashboard.cardLesson.femaleOnly");
      case "both":
        return t("adminDashboard.cardLesson.bothGenders");
      default:
        return gender;
    }
  };
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-gray-600">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <FiBook className="w-16 h-16 text-white/20" />
        </div>
        <div className="absolute top-4 right-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getGenderColor(
              lesson.target_gender
            )}`}
          >
            {getGenderText(lesson.target_gender)}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-900/80 text-white">
            {lesson.order ? `#${lesson.order}` : "N/A"}
          </span>
        </div>
        {lesson.has_video && (
          <div className="absolute bottom-4 right-4">
            <FiVideo className="w-6 h-6 text-white/80" />
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2">
            {lesson.title}
          </h3>
          <div className="flex items-center gap-1">
            {lesson.is_free ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {t("adminDashboard.cardLesson.free")}
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                {t("adminDashboard.cardLesson.paid")}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {lesson.description}
        </p>

        <div className="mb-4">
          <p className="text-gray-300 text-sm line-clamp-3">{lesson.content}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-400">
            <FiClock className="w-4 h-4" />
            <span className="text-sm">
              {lesson.duration || t("adminDashboard.cardLesson.noDuration")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <FiBook className="w-4 h-4" />
            <span className="text-sm">
              {lesson.course?.title || t("adminDashboard.cardLesson.noCourse")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                ? t("adminDashboard.cardLesson.videoReady")
                : lesson.video_status === "processing"
                ? t("adminDashboard.cardLesson.videoProcessing")
                : t("adminDashboard.cardLesson.noVideo")}
            </span>
            {lesson.duration_minutes && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {lesson.duration_minutes}{" "}
                {t("adminDashboard.cardLesson.minutes")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVideoManage && onVideoManage(lesson)}
              className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
              title={t("adminDashboard.cardLesson.manageVideo")}
            >
              <FiVideo className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(lesson)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
              title={t("adminDashboard.cardLesson.editLesson")}
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(lesson)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title={t("adminDashboard.cardLesson.deleteLesson")}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardLesson;
