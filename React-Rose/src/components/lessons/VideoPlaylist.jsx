import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaPause,
  FaCheck,
  FaClock,
  FaFileVideo,
  FaLock,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { getLessonsByCourse } from "../../api/lessons";
import { useAuth } from "../../context/AuthContext";
import i18next from "i18next";

const VideoPlaylist = ({
  courseId,
  currentLessonId,
  onLessonSelect,
  onPlayNext,
  onPlayPrevious,
  isPlaying = false,
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedLessons, setCompletedLessons] = useState(new Set());

  // Load lessons
  useEffect(() => {
    const loadLessons = async () => {
      if (!courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getLessonsByCourse(courseId, token);
        const lessonsData = response?.data?.lessons || [];

        const videoLessons = lessonsData.filter((lesson) => lesson.has_video);
        setLessons(videoLessons);

        const sections = {};
        videoLessons.forEach((lesson) => {
          if (lesson.section) {
            sections[lesson.section] = true;
          }
        });
        setExpandedSections(sections);
      } catch (err) {
        setError(err.message || t("lessons.playlist.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    loadLessons();
  }, [courseId, token, t]);

  // Group lessons by section or order
  const groupedLessons = useMemo(() => {
    if (!lessons.length) return {};

    const groups = {};
    lessons.forEach((lesson) => {
      const section = lesson.section || "main";
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(lesson);
    });

    // Sort lessons within each group by order
    Object.keys(groups).forEach((section) => {
      groups[section].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return groups;
  }, [lessons]);

  // Get current lesson index
  const currentIndex = useMemo(() => {
    const allLessons = Object.values(groupedLessons).flat();
    return allLessons.findIndex((lesson) => lesson.id === currentLessonId);
  }, [groupedLessons, currentLessonId]);

  // Get next and previous lessons
  const { nextLesson, previousLesson } = useMemo(() => {
    const allLessons = Object.values(groupedLessons).flat();
    const currentIdx = allLessons.findIndex(
      (lesson) => lesson.id === currentLessonId
    );

    return {
      nextLesson:
        currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null,
      previousLesson: currentIdx > 0 ? allLessons[currentIdx - 1] : null,
    };
  }, [groupedLessons, currentLessonId]);

  // Handle lesson selection
  const handleLessonSelect = (lesson) => {
    onLessonSelect?.(lesson);
  };

  // Handle play next
  const handlePlayNext = () => {
    if (nextLesson) {
      onPlayNext?.(nextLesson);
    }
  };

  // Handle play previous
  const handlePlayPrevious = () => {
    if (previousLesson) {
      onPlayPrevious?.(previousLesson);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mark lesson as completed
  const markLessonCompleted = (lessonId) => {
    setCompletedLessons((prev) => new Set([...prev, lessonId]));
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return "00:00";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="animate-spin text-blue-500 text-xl mr-2" />
            <span className="text-gray-600">
              {t("lessons.playlist.loading")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lessons.length) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          <div className="text-center py-8">
            <FaFileVideo className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">{t("lessons.playlist.noVideos")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("lessons.playlist.title")}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>
              {lessons.length} {t("lessons.playlist.videos")}
            </span>
            <span>•</span>
            <span>
              {formatDuration(
                lessons.reduce(
                  (total, lesson) => total + (lesson.video_duration || 0),
                  0
                )
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t("lessons.playlist.progress")}</span>
            <span>
              {Math.round((completedLessons.size / lessons.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(completedLessons.size / lessons.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePlayPrevious}
            disabled={!previousLesson}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              previousLesson
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {i18next.language === "ar" ? (
              <>
                <FaChevronRight className="w-4 h-4" />
                <span>{t("lessons.playlist.previous")}</span>
              </>
            ) : (
              <>
                <FaChevronLeft className="w-4 h-4" />
                <span>{t("lessons.playlist.previous")}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
            <span>
              {currentIndex + 1} / {lessons.length}
            </span>
          </div>

          <button
            onClick={handlePlayNext}
            disabled={!nextLesson}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              nextLesson
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            {i18next.language === "ar" ? (
              <>
                <span>{t("lessons.playlist.next")}</span>
                <FaChevronLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t("lessons.playlist.next")}</span>
                <FaChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lessons List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedLessons).map(([section, sectionLessons]) => (
          <div key={section} className="border-b last:border-b-0">
            {/* Section Header */}
            {section !== "main" && (
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSection(section)}
              >
                <h4 className="font-medium text-gray-700">{section}</h4>
                {expandedSections[section] ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </div>
            )}

            {/* Section Lessons */}
            {(section === "main" || expandedSections[section]) && (
              <div className="divide-y">
                {sectionLessons.map((lesson, index) => {
                  const isCurrent = lesson.id === currentLessonId;
                  const isCompleted = completedLessons.has(lesson.id);
                  const isLocked = !lesson.can_access;

                  return (
                    <div
                      key={lesson.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-blue-50 border-r-4 border-blue-600"
                          : "hover:bg-gray-50"
                      } ${isLocked ? "opacity-60" : ""}`}
                      onClick={() => !isLocked && handleLessonSelect(lesson)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Play/Status Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {isLocked ? (
                            <FaLock className="text-gray-400" />
                          ) : isCurrent && isPlaying ? (
                            <FaPause className="text-blue-600" />
                          ) : isCompleted ? (
                            <FaCheck className="text-green-500" />
                          ) : (
                            <FaPlay className="text-gray-400" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <h5
                            className={`text-sm font-medium ${
                              isCurrent ? "text-blue-600" : "text-gray-800"
                            }`}
                          >
                            {lesson.title}
                          </h5>

                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <FaClock />
                              <span>
                                {lesson.video_duration_formatted ||
                                  formatDuration(lesson.video_duration)}
                              </span>
                            </div>

                            {lesson.video_size_formatted && (
                              <div className="flex items-center space-x-1">
                                <FaFileVideo />
                                <span>{lesson.video_size_formatted}</span>
                              </div>
                            )}

                            {lesson.is_free && (
                              <span className="text-green-600 font-medium">
                                {t("lessons.playlist.free")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Number */}
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {lesson.order || index + 1}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlaylist;
