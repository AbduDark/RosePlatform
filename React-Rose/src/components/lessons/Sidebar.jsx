import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaPlay,
  FaCheck,
  FaLock,
  FaVideo,
  FaSearch,
  FaClock,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

function Sidebar({
  lessons = [],
  currentLessonId,
  onSelectLesson,
  courseTitle = "",
  userSubscribed = false,
  isAdmin = false,
  onCloseMobileSidebar,
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Completed lessons from local storage for progress tracking
  const [completedLessonIds, setCompletedLessonIds] = useState(() => {
    try {
      const saved = localStorage.getItem("completed_lessons");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter lessons by search query
  const filteredLessons = useMemo(() => {
    if (!searchTerm.trim()) return lessons;
    const term = searchTerm.toLowerCase();
    return lessons.filter(
      (l) =>
        l.title?.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term)
    );
  }, [lessons, searchTerm]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!lessons.length) return 0;
    const completedCount = lessons.filter((l) =>
      completedLessonIds.includes(l.id)
    ).length;
    return Math.min(100, Math.round((completedCount / lessons.length) * 100));
  }, [lessons, completedLessonIds]);

  const toggleLessonComplete = (e, lessonId) => {
    e.stopPropagation();
    setCompletedLessonIds((prev) => {
      const updated = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem("completed_lessons", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save progress", err);
      }
      return updated;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-l border-slate-800 shadow-2xl">
      {/* Header Section */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FaVideo className="text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white line-clamp-1">
                {courseTitle || t("lessons.sidebar.title", "قائمة الدروس")}
              </h3>
              <p className="text-xs text-slate-400">
                {lessons.length}{" "}
                {t("lessons.sidebar.episodesCount", "درس متاح")}
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobileSidebar && (
            <button
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-base" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {lessons.length > 0 && (
          <div className="mt-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-slate-400">
                {t("lessons.sidebar.progress", "نسبة الإنجاز")}
              </span>
              <span className="text-blue-400 font-bold">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mt-3">
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("lessons.sidebar.searchPlaceholder", "بحث في الدروس...")}
            className="w-full pl-3 pr-8 py-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Accordion / Lessons List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{t("lessons.sidebar.episodes", "الحلقات")}</span>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="space-y-2">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                <p className="text-sm text-slate-400">
                  {searchTerm
                    ? t("lessons.sidebar.noSearchResults", "لا توجد نتائج تطابق بحثك")
                    : t("lessons.sidebar.noEpisodes", "لا توجد حلقات متاحة")}
                </p>
              </div>
            ) : (
              filteredLessons.map((lesson, idx) => {
                const isActive = lesson.id === Number(currentLessonId);
                const isCompleted = completedLessonIds.includes(lesson.id);
                const canAccess =
                  isAdmin || lesson.is_free || userSubscribed || lesson.can_access;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => onSelectLesson?.(lesson)}
                    className={`group relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/80 shadow-lg shadow-blue-500/10"
                        : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Active Indicator Line */}
                    {isActive && (
                      <div className="absolute right-0 top-3 bottom-3 w-1 bg-blue-500 rounded-l-full" />
                    )}

                    {/* Status Checkbox / Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleLessonComplete(e, lesson.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isCompleted
                            ? "bg-green-600 border-green-500 text-white"
                            : isActive
                            ? "bg-blue-600 border-blue-500 text-white animate-pulse"
                            : "bg-slate-800 border-slate-700 text-slate-400 group-hover:border-slate-600"
                        }`}
                        title={
                          isCompleted
                            ? t("lessons.sidebar.markIncomplete", "تحديد كغير مكتمل")
                            : t("lessons.sidebar.markComplete", "تحديد كمكتمل")
                        }
                      >
                        {isCompleted ? (
                          <FaCheck className="text-xs" />
                        ) : isActive ? (
                          <FaPlay className="text-[10px] ml-0.5" />
                        ) : !canAccess ? (
                          <FaLock className="text-[10px] text-amber-400" />
                        ) : (
                          <span className="text-xs font-semibold">
                            {idx + 1}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Lesson Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={`text-xs font-bold line-clamp-2 transition-colors ${
                            isActive
                              ? "text-blue-400"
                              : "text-slate-200 group-hover:text-white"
                          }`}
                        >
                          {lesson.title}
                        </h4>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {/* Duration Badge */}
                        {(lesson.video_duration_formatted ||
                          lesson.duration_minutes ||
                          lesson.duration) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-400 border border-slate-700/60">
                            <FaClock className="text-[9px]" />
                            {lesson.video_duration_formatted ||
                              `${lesson.duration_minutes || lesson.duration} د`}
                          </span>
                        )}

                        {/* Free Badge */}
                        {lesson.is_free ? (
                          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold">
                            {t("lessons.sidebar.free", "مجاني")}
                          </span>
                        ) : !canAccess ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-medium inline-flex items-center gap-1">
                            <FaLock className="text-[8px]" />
                            {t("lessons.sidebar.locked", "مغلق")}
                          </span>
                        ) : null}

                        {/* Target Gender Badge */}
                        {lesson.target_gender &&
                          lesson.target_gender !== "both" && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                              {lesson.target_gender === "male"
                                ? "بنين"
                                : "بنات"}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1);
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
