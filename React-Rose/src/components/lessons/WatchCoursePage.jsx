import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaBookOpen,
  FaCommentDots,
  FaLock,
  FaInfoCircle,
  FaRedo,
  FaGraduationCap,
  FaClock,
  FaCheckCircle,
  FaUserGraduate,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import VideoJSPlayer from "./VideoJSPlayer";
import YouTubeSecurePlayer from "./YouTubeSecurePlayer";
import CommentLesson from "./CommentLesson";
import { getLessonsByCourse } from "../../api/lessons";
import { getCourseById } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";
import i18next from "i18next";

const WatchCoursePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const { token, user } = useAuth();

  const isRtl = i18next.language === "ar";
  const isAdmin = Boolean(user && (user.is_admin || user.role === "admin"));

  // Main state
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [userSubscribed, setUserSubscribed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch course & lessons from API
  const loadData = useCallback(async () => {
    if (!courseId) {
      setError(t("lessons.courseInfo.title", "معلومات الدورة غير صحيحة"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch normalized lessons & course state from lessons API
      const normalizedData = await getLessonsByCourse(courseId, token);

      const fetchedLessons = normalizedData.lessons || [];
      const fetchedCourse = normalizedData.course || null;
      const isSubscribed = Boolean(normalizedData.user_subscribed || isAdmin);
      const subInfo = normalizedData.subscription_info || null;

      setLessons(fetchedLessons);
      setUserSubscribed(isSubscribed);
      setSubscriptionInfo(subInfo);

      // 2. Fetch full course details if missing or to enrich metadata
      if (fetchedCourse) {
        setCourse(fetchedCourse);
      } else {
        try {
          const courseRes = await getCourseById(courseId);
          if (courseRes?.data) setCourse(courseRes.data);
        } catch (err) {
          console.warn("Could not fetch course metadata fallback", err);
        }
      }

      // Check if no lessons exist for this course
      if (fetchedLessons.length === 0) {
        setError(t("lessons.sidebar.noEpisodes", "لا توجد حلقات متاحة لهذه الدورة"));
        setIsLoading(false);
        return;
      }

      // 3. Select lesson based on URL parameter or fallback to first
      let targetId = lessonId ? Number(lessonId) : null;
      const foundLesson = fetchedLessons.find((l) => l.id === targetId);

      if (foundLesson) {
        setCurrentLessonId(targetId);
      } else {
        const firstLesson = fetchedLessons[0];
        if (firstLesson) {
          setCurrentLessonId(firstLesson.id);
          navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, {
            replace: true,
          });
        }
      }
    } catch (e) {
      console.error("Error loading course lessons:", e);
      setError(
        e.message || t("lessons.videoPlayer.error", "حدث خطأ أثناء تحميل الكورس")
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId, token, isAdmin, navigate, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter lessons based on user gender (Admins see everything)
  const filteredLessons = useMemo(() => {
    if (!user || !user.gender || isAdmin) {
      return lessons;
    }

    return lessons.filter((lesson) => {
      const targetGender = lesson.target_gender;
      if (!targetGender || targetGender === "both") {
        return true;
      }
      return targetGender === user.gender;
    });
  }, [lessons, user, isAdmin]);

  // Current active lesson object
  const currentLesson = useMemo(() => {
    if (!currentLessonId) return null;
    const found = filteredLessons.find((l) => l.id === Number(currentLessonId));
    if (found) return found;
    return filteredLessons.length > 0 ? filteredLessons[0] : null;
  }, [filteredLessons, currentLessonId]);

  // Auto-poll lessons data if current lesson is processing
  useEffect(() => {
    let timer;
    if (currentLesson?.video_status === "processing" && courseId) {
      timer = setInterval(async () => {
        try {
          const normalizedData = await getLessonsByCourse(courseId, token);
          if (normalizedData?.lessons) {
            setLessons(normalizedData.lessons);
          }
        } catch {
          // ignore transient poll errors
        }
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentLesson?.video_status, courseId, token]);

  // Navigation indexes
  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return filteredLessons.findIndex((l) => l.id === currentLesson.id);
  }, [filteredLessons, currentLesson]);

  const previousLesson = useMemo(() => {
    if (currentIndex > 0) return filteredLessons[currentIndex - 1];
    return null;
  }, [filteredLessons, currentIndex]);

  const nextLesson = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < filteredLessons.length - 1) {
      return filteredLessons[currentIndex + 1];
    }
    return null;
  }, [filteredLessons, currentIndex]);

  // Handle lesson selection
  const handleLessonSelect = (lesson) => {
    setCurrentLessonId(lesson.id);
    setIsMobileSidebarOpen(false);
    navigate(`/courses/${courseId}/lessons/${lesson.id}`, { replace: true });
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      handleLessonSelect(nextLesson);
    }
  };

  const handlePreviousLesson = () => {
    if (previousLesson) {
      handleLessonSelect(previousLesson);
    }
  };

  // Determine video URL and access permissions
  const canAccessCurrentLesson = useMemo(() => {
    if (!currentLesson) return false;
    return (
      isAdmin ||
      currentLesson.is_free ||
      userSubscribed ||
      currentLesson.can_access
    );
  }, [currentLesson, isAdmin, userSubscribed]);

  const isYouTubeVideo = useMemo(() => {
    if (!currentLesson) return false;
    return (
      currentLesson.video_source === "youtube" ||
      Boolean(currentLesson.youtube_url) ||
      (currentLesson.video_url && currentLesson.video_url.includes("youtube"))
    );
  }, [currentLesson]);

  // Render Skeleton Loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-secondary border-b-transparent border-l-transparent animate-spin" />
            <FaGraduationCap className="absolute inset-0 m-auto text-primary text-xl" />
          </div>
          <h2 className="text-lg font-bold text-slate-200">
            {t("lessons.videoPlayer.loading", "جاري تحميل محتوى الدورة...")}
          </h2>
          <p className="text-xs text-slate-400">
            يرجى الانتظار لحين تجهيز المشغل والدروس...
          </p>
        </div>
      </div>
    );
  }

  // Render Error Alert
  if (error && lessons.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <FaInfoCircle className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t("lessons.sidebar.noEpisodesTitle", "تعذر عرض الكورس")}
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              <FaRedo className="text-xs" />
              {t("common.retry", "إعادة المحاولة")}
            </button>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              صفحة الكورس
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Course info */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 shadow-sm flex-shrink-0 cursor-pointer"
              title={t("common.back", "رجوع للكورس")}
            >
              {isRtl ? (
                <FaChevronRight className="text-sm" />
              ) : (
                <FaChevronLeft className="text-sm" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                  دورة
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {course?.title || `${t("lessons.title", "كورس")} #${courseId}`}
                </h1>
              </div>
              {currentLesson && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  <span className="text-primary font-medium">
                    الدرس {currentIndex + 1}:
                  </span>{" "}
                  {currentLesson.title}
                </p>
              )}
            </div>
          </div>

          {/* Top Actions: Mobile Drawer Button & Active Sub Badge */}
          <div className="flex items-center gap-3">
            {userSubscribed && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <FaCheckCircle className="text-xs" />
                <span>اشتراك نشط</span>
              </div>
            )}

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
            >
              <FaList />
              <span>{t("lessons.sidebar.episodes", "الحلقات")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area: Player, Description & Comments */}
        <main className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-5 gap-6 custom-scrollbar">
          {/* Player Container */}
          <div className="w-full bg-slate-900 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            {currentLesson ? (
              canAccessCurrentLesson ? (
                isYouTubeVideo ? (
                  <YouTubeSecurePlayer
                    key={currentLesson.id}
                    embedUrl={
                      currentLesson.secure_embed_url ||
                      currentLesson.youtube_url ||
                      currentLesson.video_url
                    }
                    lessonTitle={currentLesson.title}
                    lessonId={currentLesson.id}
                  />
                ) : currentLesson.video_status === "processing" ? (
                  /* Video Processing Notice Overlay */
                  <div
                    className="relative w-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-indigo-500/20"
                    style={{ minHeight: "380px" }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 shadow-xl shadow-purple-500/10">
                      <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      جاري معالجة وتقليص الفيديو... ⚙️
                    </h3>
                    <p className="text-sm text-slate-300 max-w-md mb-4 leading-relaxed">
                      يتم الآن معالجة الفيديو وضغطه على السيرفر ليعمل بأعلى سرعة وبدون تقطيع. سيظهر الفيديو هنا تلقائياً فور انتهاء المعالجة.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span>جاري التحديث التلقائي...</span>
                    </div>
                  </div>
                ) : currentLesson.video_status === "failed" ? (
                  /* Video Failed Notice Overlay */
                  <div
                    className="relative w-full bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-red-500/20"
                    style={{ minHeight: "380px" }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
                      <FaInfoCircle className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      فشل في معالجة الفيديو
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
                      حدث خطأ غير متوقع أثناء معالجة هذا الفيديو على السيرفر. يرجى التواصل مع المحاضر لإعادة رفع الفيديو.
                    </p>
                  </div>
                ) : (
                  <VideoJSPlayer
                    key={currentLesson.id}
                    videoUrl={currentLesson.video_url}
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    onVideoEnd={handleNextLesson}
                  />
                )
              ) : (
                /* Subscription Required Notice Overlay */
                <div
                  className="relative w-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
                  style={{ minHeight: "380px" }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                    <FaLock className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("overviewCourse.subscribeToView", "هذا الدرس يتطلب اشتراكاً نشطاً")}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                    يرجى الاشتراك في الدورة لتتمكن من مشاهدة جميع الدروس والمحتوى التعليمي الخاص بها.
                  </p>
                  <Link
                    to={`/courses/${courseId}`}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
                  >
                    <FaExternalLinkAlt />
                    <span>اشترك الآن لمشاهدة الدرس</span>
                  </Link>
                </div>
              )
            ) : (
              /* No Lesson Selected */
              <div
                className="w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center"
                style={{ minHeight: "380px" }}
              >
                <FaBookOpen className="text-5xl text-slate-700 mb-3" />
                <h3 className="text-lg font-bold text-slate-300">
                  لم يتم اختيار أي درس
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  اختر درساً من قائمة الحلقات الجانبية للبدء
                </p>
              </div>
            )}

            {/* Navigation Bar (Prev / Next) */}
            {currentLesson && (
              <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-3">
                {/* Previous Lesson Button */}
                <button
                  onClick={handlePreviousLesson}
                  disabled={!previousLesson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                >
                  {isRtl ? <FaChevronRight /> : <FaChevronLeft />}
                  <span className="hidden sm:inline">
                    {previousLesson
                      ? previousLesson.title
                      : t("lessons.previous", "الدرس السابق")}
                  </span>
                  <span className="sm:hidden">{t("lessons.previous", "السابق")}</span>
                </button>

                {/* Lesson Counter */}
                <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                  {currentIndex + 1} من {filteredLessons.length} دروس
                </span>

                {/* Next Lesson Button */}
                <button
                  onClick={handleNextLesson}
                  disabled={!nextLesson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                >
                  <span className="hidden sm:inline">
                    {nextLesson
                      ? nextLesson.title
                      : t("lessons.next", "الدرس التالي")}
                  </span>
                  <span className="sm:hidden">{t("lessons.next", "التالي")}</span>
                  {isRtl ? <FaChevronLeft /> : <FaChevronRight />}
                </button>
              </div>
            )}
          </div>

          {/* Lesson Title & Details Header */}
          {currentLesson && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                    الدرس #{currentIndex + 1}
                  </span>
                  {currentLesson.duration_minutes && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
                      <FaClock className="text-slate-400 text-xs" />
                      {currentLesson.duration_minutes} دقيقة
                    </span>
                  )}
                  {currentLesson.is_free && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      درس مجاني
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {currentLesson.title}
              </h2>

              {/* Description Card */}
              {currentLesson.description && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed">
                  <h4 className="font-bold text-slate-200 mb-1 text-xs uppercase tracking-wider">
                    الوصف المختصر:
                  </h4>
                  <p>{currentLesson.description}</p>
                </div>
              )}

              {/* Detailed Content Body */}
              {currentLesson.content && (
                <div>
                  <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    محتوى الدرس:
                  </h3>
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/20 p-4 rounded-xl border border-slate-800/60 whitespace-pre-wrap">
                    {currentLesson.content}
                  </div>
                </div>
              )}

              {/* Instructor info block */}
              {course && (
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                      <FaUserGraduate />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {course.instructor_name || "روز أكاديمي"}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        مدرس الكورس • {course.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMENTS SECTION - PLACED DIRECTLY BELOW THE LESSON */}
          {currentLessonId && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl">
              <CommentLesson lessonId={currentLessonId} />
            </div>
          )}
        </main>

        {/* Desktop Sidebar Playlist */}
        <aside className="hidden lg:block w-80 flex-shrink-0 h-auto overflow-hidden">
          <Sidebar
            lessons={filteredLessons}
            currentLessonId={currentLessonId}
            onSelectLesson={handleLessonSelect}
            courseTitle={course?.title}
            userSubscribed={userSubscribed}
            isAdmin={isAdmin}
          />
        </aside>

        {/* Mobile Slide-over Drawer Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            />

            {/* Content Sidebar Panel */}
            <div className="relative flex-1 max-w-xs w-full h-full bg-slate-900 z-10 shadow-2xl">
              <Sidebar
                lessons={filteredLessons}
                currentLessonId={currentLessonId}
                onSelectLesson={handleLessonSelect}
                courseTitle={course?.title}
                userSubscribed={userSubscribed}
                isAdmin={isAdmin}
                onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchCoursePage;