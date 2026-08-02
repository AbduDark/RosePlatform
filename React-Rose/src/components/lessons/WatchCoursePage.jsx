import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronLeft } from "react-icons/fa";
import CommentLesson from "./CommentLesson";
import Sidebar from "./Sidebar";
import VideoJSPlayer from "./VideoJSPlayer";
import { useParams, useNavigate } from "react-router-dom";
import { getLessonsByCourse } from "../../api/lessons";
import { useAuth } from "../../context/AuthContext";

const WatchCoursePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const { token, user } = useAuth();

  const [lessons, setLessons] = useState([]);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [isPurchased] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        setError(t("lessons.courseInfo.title"));
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await getLessonsByCourse(courseId, token);
        const lessonsData = response?.data?.lessons || [];
        setLessons(lessonsData);

        if (lessonsData.length === 0) {
          setError(t("lessons.sidebar.noEpisodes"));
          setIsLoading(false);
          return;
        }

        // Set current lesson ID
        let initialLessonId = lessonId ? Number(lessonId) : null;
        const validLesson = lessonsData.find(
          (l) => l.id === initialLessonId
        );

        if (validLesson) {
          setCurrentLessonId(initialLessonId);
        } else {
          // Fallback to the first lesson (with or without video)
          const firstLesson = lessonsData[0];
          if (firstLesson) {
            setCurrentLessonId(firstLesson.id);
            navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, {
              replace: true,
            });
          } else {
            setError(t("lessons.sidebar.noEpisodes"));
          }
        }
      } catch (e) {
        console.error("Error loading lessons:", e);
        setError(e.message || t("lessons.videoPlayer.error"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId, lessonId, navigate, token, t]);

  // Filter lessons based on user gender and target_gender
  const filteredLessons = useMemo(() => {
    if (!user || !user.gender) {
      return lessons;
    }

    return lessons.filter((lesson) => {
      const targetGender = lesson.target_gender;

      // Show lessons with "both" to everyone
      if (targetGender === "both") {
        return true;
      }

      // Show lessons that match the user's gender
      // male lessons for male users, female lessons for female users
      return targetGender === user.gender;
    });
  }, [lessons, user]);

  const currentLesson = useMemo(() => {
    // Return null if no lesson ID is set yet
    if (!currentLessonId) {
      return null;
    }
    
    const lesson = filteredLessons.find((l) => l.id === Number(currentLessonId));
    if (!lesson) {
      console.warn("Current lesson not found:", currentLessonId);
      // Fallback to first lesson if current lesson is not found
      return filteredLessons.length > 0 ? filteredLessons[0] : null;
    }
    return lesson;
  }, [filteredLessons, currentLessonId]);

  // Ensure current lesson is available after filtering
  useEffect(() => {
    if (filteredLessons.length > 0 && currentLessonId) {
      const isCurrentLessonAvailable = filteredLessons.some(
        (l) => l.id === currentLessonId
      );

      if (!isCurrentLessonAvailable) {
        // If current lesson is filtered out, select the first available lesson
        const firstAvailableLesson = filteredLessons[0];
        if (firstAvailableLesson) {
          setCurrentLessonId(firstAvailableLesson.id);
          navigate(`/courses/${courseId}/lessons/${firstAvailableLesson.id}`, {
            replace: true,
          });
        }
      }
    }
  }, [filteredLessons, currentLessonId, courseId, navigate]);

  // Handle lesson selection
  const handleLessonSelect = (lesson) => {
    if (!lesson.has_video) {
      console.warn("Selected lesson has no video:", lesson);
      setCurrentLessonId(lesson.id);
      navigate(`/courses/${courseId}/lessons/${lesson.id}`, { replace: true });
      return;
    }

    if (!lesson.video_url) {
      console.warn("Lesson marked as has_video but no video URL:", lesson);
      setCurrentLessonId(lesson.id);
      navigate(`/courses/${courseId}/lessons/${lesson.id}`, { replace: true });
      return;
    }

    console.log("Selected lesson:", lesson.id, "Video URL:", lesson.video_url);
    setCurrentLessonId(lesson.id);
    navigate(`/courses/${courseId}/lessons/${lesson.id}`, { replace: true });
    setIsVideoPlaying(false);
  };

  // Handle video end
  const handleVideoEnd = () => {
    setIsVideoPlaying(false);
    const currentIndex = filteredLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex < filteredLessons.length - 1) {
      const nextLesson = filteredLessons[currentIndex + 1];
      handleLessonSelect(nextLesson);
    }
  };

  // Handle play next
  const handlePlayNext = () => {
    const currentIndex = filteredLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex < filteredLessons.length - 1) {
      const nextLesson = filteredLessons[currentIndex + 1];
      handleLessonSelect(nextLesson);
    }
  };

  // Handle play previous
  const handlePlayPrevious = () => {
    const currentIndex = filteredLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex > 0) {
      const previousLesson = filteredLessons[currentIndex - 1];
      handleLessonSelect(previousLesson);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <p className="text-lg font-medium text-primary dark:text-primary-light">
          {t("lessons.videoPlayer.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <p className="text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!isPurchased) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 min-h-screen transition-colors">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4 text-primary dark:text-primary-light">
            {t("lessons.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("overviewCourse.subscribeToView")}
          </p>
          <button className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md transition-colors">
            {t("enrollCourse.enrollNow")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <div
        dir="ltr"
        className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate(-1)}
          >
            <FaChevronLeft className="h-5 w-5 text-primary dark:text-primary-light" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-primary dark:text-primary-light">
              {t("lessons.title")} #{courseId}
            </h1>
            {currentLesson && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{currentLesson.title}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="lg:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-auto transition-colors">
          <div className="space-y-4">
            <Sidebar
              lessons={filteredLessons}
              currentLessonId={currentLessonId}
              onSelectLesson={handleLessonSelect}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 p-4 gap-4 overflow-auto">
          {/* Video Player */}
          {currentLesson ? (
            <>
              <VideoJSPlayer
                key={currentLessonId}
                videoUrl={currentLesson.video_url}
                lessonId={currentLessonId}
                lessonTitle={currentLesson.title}
                onVideoEnd={handleVideoEnd}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4 px-2">
                <button
                  onClick={handlePlayPrevious}
                  disabled={filteredLessons.findIndex(l => l.id === currentLessonId) === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
                >
                  <FaChevronLeft />
                  <span className="font-medium">{t("lessons.previous") || "الدرس السابق"}</span>
                </button>

                <button
                  onClick={handlePlayNext}
                  disabled={filteredLessons.findIndex(l => l.id === currentLessonId) === filteredLessons.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
                >
                  <span className="font-medium">{t("lessons.next") || "الدرس التالي"}</span>
                  <FaChevronLeft className="rotate-180" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center transition-colors shadow-xl" style={{ minHeight: "400px" }}>
              <div className="text-center p-8">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t("lessons.videoPlayer.noLesson", "لم يتم اختيار درس")}
                </h3>
                <p className="text-gray-300 text-base">
                  الرجاء اختيار درس من القائمة الجانبية
                </p>
              </div>
            </div>
          )}

          {/* Comments */}
          {currentLessonId && <CommentLesson lessonId={currentLessonId} />}
        </div>
      </div>
    </div>
  );
};

export default WatchCoursePage;