import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiXCircle } from "react-icons/fi";
import { deleteAdminCourse } from "../../../api/courses";
import { useAuth } from "../../../context/AuthContext";
import i18next from "i18next";

function DeleteCourse({ course, onCourseDeleted, isOpen, onClose }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteCourse = async () => {
    setIsLoading(true);
    setError("");

    console.log("=== DELETE COURSE START ===");
    console.log("Course ID:", course.id);
    console.log("Token exists:", token ? "Yes" : "No");
    console.log("Language:", i18next.language);

    if (!token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await deleteAdminCourse(course.id, token, i18next.language);
      console.log("=== DELETE SUCCESS ===");
      console.log("Response:", response);
      
      onClose();
      if (onCourseDeleted) {
        onCourseDeleted(course.id);
      }
    } catch (err) {
      console.error("=== DELETE ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      setError(err.message || "Failed to delete course");
    } finally {
      setIsLoading(false);
      console.log("=== DELETE COURSE END ===");
    }
  };
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-700">
        <div className="text-center">
          <FiXCircle className="w-11 h-11 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t("adminDashboard.deleteCourse.title")}
          </h3>
          <p className="mb-4 text-gray-300">
            {t("adminDashboard.deleteCourse.confirmMessage", {
              title: course.title,
            })}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          <div
            className={`flex justify-center items-center space-x-4 ${
              i18next.language === "ar" ? "space-x-reverse" : ""
            }`}
          >
            <button
              onClick={onClose}
              className="py-2 px-3 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg border border-gray-500 hover:bg-gray-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {t("adminDashboard.deleteCourse.cancel")}
            </button>
            <button
              onClick={handleDeleteCourse}
              className="py-2 px-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading
                ? t("adminDashboard.deleteCourse.deleting")
                : t("adminDashboard.deleteCourse.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteCourse;
