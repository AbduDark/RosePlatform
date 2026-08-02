import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiBook } from "react-icons/fi";
import { getAllLessons } from "../../../api/lessons";
import { getCourses } from "../../../api/courses";
import { useAuth } from "../../../context/AuthContext";
import CreateLesson from "./CreateLessons";
import UpdateLesson from "./UpdateLessons";
import DeleteLesson from "./DeleteLessons";
import SearchLesson from "./SearchLessons";
import CardLesson from "./CardLessons";
import VideoUpload from "./VideoUpload";
import Pagination from "../../common/Pagination";

const LessonsManager = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [lessonForVideo, setLessonForVideo] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        setPage(1); // Reset to first page when searching
        fetchLessons(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm === "") {
      fetchLessons(page);
    }
  }, [page, selectedCourse]);

  useEffect(() => {
    fetchCoursesList();
  }, []);

  useEffect(() => {
    // Ensure lessons is an array before filtering
    const lessonsArray = Array.isArray(lessons) ? lessons : lessons?.data || [];
    const filtered = lessonsArray.filter((lesson) => {
      const matchesSearch =
        !searchTerm ||
        lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.content?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === "all" ||
        lesson.is_free === (selectedFilter === "free");

      const matchesCourse =
        selectedCourse === "all" ||
        lesson.course_id === parseInt(selectedCourse);

      return matchesSearch && matchesFilter && matchesCourse;
    });
    setFilteredLessons(filtered);
  }, [lessons, searchTerm, selectedFilter, selectedCourse]);

  const fetchLessons = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      setError("");

      const params = { 
        page: pageNum,
        per_page: 12,
        search: searchTerm
      };

      if (selectedCourse !== "all") {
        params.course_id = selectedCourse;
      }

      console.log("Fetching lessons with params:", params);

      const response = await getAllLessons(params, token);
      console.log("Lessons API response:", response);

      if (!response) {
        // Token was invalid and user was redirected
        return;
      }

      // Check if response indicates failure
      if (response.success === false) {
        throw new Error(response.message?.en || response.message || "Failed to fetch lessons");
      }

      // Handle different response formats
      let lessonsData = [];
      let metaData = null;

      if (response && response.success !== false) {
        // Check for Laravel pagination format
        if (response.data && Array.isArray(response.data)) {
          lessonsData = response.data;
          metaData = response.meta || response;
        }
        // Check for direct array
        else if (Array.isArray(response)) {
          lessonsData = response;
        }
        // Check for nested data
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          lessonsData = response.data.data;
          metaData = response.data;
        }
        // Check for simple data object
        else if (response.data && Array.isArray(response.data)) {
          lessonsData = response.data;
          metaData = response;
        }
      }
      
      console.log("Processed lessons data:", lessonsData);
      console.log("Meta data:", metaData);
      
      setLessons(lessonsData);
      setMeta(metaData);
      setPage(metaData?.current_page || pageNum);

    } catch (err) {
      console.error("Failed to fetch lessons:", err);
      setError(
        err.message || t("adminDashboard.lessonsManager.failedToFetch")
      );
      setLessons([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoursesList = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const handleLessonCreated = (newLesson) => {
    // Refresh the entire list to get updated data
    fetchLessons(page);
    setIsCreateModalOpen(false);

    // Show success message
    const successMessage = t("adminDashboard.lessonsManager.createSuccess");
    console.log(successMessage);
  };

  const handleLessonUpdated = (updatedLesson) => {
    // Update local state immediately for better UX
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === updatedLesson.id ? { ...lesson, ...updatedLesson } : lesson
      )
    );
    setIsEditModalOpen(false);
    setCurrentLesson(null);

    // Refresh data to ensure consistency
    setTimeout(() => fetchLessons(page), 500);

    // Show success message
    const successMessage = t("adminDashboard.lessonsManager.updateSuccess");
    console.log(successMessage);
  };

  const handleLessonDeleted = (lessonId) => {
    // Remove from local state immediately
    setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    setIsDeleteModalOpen(false);
    setLessonToDelete(null);

    // Refresh to ensure consistency
    setTimeout(() => fetchLessons(page), 500);

    // Show success message
    const successMessage = t("adminDashboard.lessonsManager.deleteSuccess");
    console.log(successMessage);
  };

  const handleEditLesson = (lesson) => {
    setCurrentLesson(lesson);
    setIsEditModalOpen(true);
  };

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson);
    setIsDeleteModalOpen(true);
  };

  const handleVideoManage = (lesson) => {
    setLessonForVideo(lesson);
    setIsVideoModalOpen(true);
  };

  const handleVideoUpdated = () => {
    // Refresh lessons data to get updated video status
    fetchLessons(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">
          {t("adminDashboard.lessonsManager.loadingLessons")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between md:flex-row flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("adminDashboard.lessonsManager.title")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {filteredLessons.length}{" "}
              {t("adminDashboard.lessonsManager.lessonsCount", {
                total: lessons.length,
              })}
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center mt-4 md:mt-0 gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <FiPlus className="w-4 h-4" />
              {t("adminDashboard.lessonsManager.addLesson")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <SearchLesson
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          courses={courses}
        />
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {t("adminDashboard.lessonsManager.noLessonsFound")}
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedFilter !== "all" || selectedCourse !== "all"
              ? t("adminDashboard.lessonsManager.tryAdjustingFilters")
              : t("adminDashboard.lessonsManager.noLessonsDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <CardLesson
                key={lesson.id}
                lesson={lesson}
                onEdit={() => handleEditLesson(lesson)}
                onDelete={() => handleDeleteLesson(lesson)}
                onVideoManage={() => handleVideoManage(lesson)}
              />
            ))}
          </div>
          {meta && meta.last_page > 1 && (
            <Pagination
              page={page}
              setPage={setPage}
              pageCount={meta.last_page}
              totalItems={meta.total}
              itemsPerPage={meta.per_page || 12}
            />
          )}
        </>
      )}

      {/* Create Lesson Modal */}
      <CreateLesson
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLessonCreated={handleLessonCreated}
        courses={courses}
      />

      {/* Edit Lesson Modal */}
      <UpdateLesson
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lesson={currentLesson}
        onLessonUpdated={handleLessonUpdated}
        courses={courses}
      />

      {/* Delete Lesson Modal */}
      <DeleteLesson
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        lesson={lessonToDelete}
        onLessonDeleted={handleLessonDeleted}
      />

      {/* Video Upload Modal */}
      <VideoUpload
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        lesson={lessonForVideo}
        onVideoUpdated={handleVideoUpdated}
      />
    </div>
  );
};

export default LessonsManager;