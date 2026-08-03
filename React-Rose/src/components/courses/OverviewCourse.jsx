import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBook, FaPlay, FaLock, FaCheckCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById } from "../../api/courses";
import { getLessonsByCourse } from "../../api/lessons";
import { getSubscriptionStatus } from "../../api/subscriptions";
import { useAuth } from "../../context/AuthContext";
import IntroVideo from "./IntroVideo";

function OverviewCourse() {
  const { t } = useTranslation();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { courseId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        setCourse(res.data || res);

        // Fetch curriculum lessons (free + premium)
        const lessonsRes = await getLessonsByCourse(courseId, token);
        const fetchedLessons = lessonsRes?.lessons || lessonsRes?.data?.lessons || [];
        setLessons(fetchedLessons);

        if (token) {
          try {
            const statusRes = await getSubscriptionStatus(token, courseId);
            const subData = statusRes?.data || statusRes;
            setIsSubscribed(Boolean(subData?.is_active || subData?.subscription_status === 'active' || user?.role === 'admin' || user?.is_admin));
          } catch {
            setIsSubscribed(Boolean(user?.role === 'admin' || user?.is_admin));
          }
        }
      } catch (err) {
        console.error("Error loading course overview:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, token, user]);

  if (loading || !course) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400 animate-pulse">
        جاري تحميل محتوى الكورس...
      </div>
    );
  }

  const handleLessonClick = (lesson) => {
    // If lesson is free OR user has subscription/admin access -> navigate to lesson player
    if (lesson.is_free || lesson.can_access || isSubscribed) {
      navigate(`/courses/${courseId}/lessons/${lesson.id}`);
    } else {
      // Scroll to enrollment section / action card
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Video */}
      {course.intro_video_url && (
        <IntroVideo
          introVideoUrl={course.intro_video_url}
          courseTitle={course.title}
        />
      )}

      {/* Description */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t("overviewCourse.description", "عن الكورس")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {course.description}
        </p>
      </div>

      {/* Curriculum Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("overviewCourse.curriculum", "منهج الكورس")}
          </h2>
          <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary dark:bg-primary/20 rounded-full">
            {lessons.length} {t("overviewCourse.episodes", "دروس")}
          </span>
        </div>

        {lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((episode, idx) => {
              const canPlay = episode.is_free || episode.can_access || isSubscribed;
              return (
                <div
                  key={episode.id}
                  onClick={() => handleLessonClick(episode)}
                  className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    canPlay
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-md"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg text-lg flex items-center justify-center ${
                        canPlay
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                      }`}
                    >
                      {canPlay ? <FaPlay className="text-sm ml-0.5" /> : <FaLock className="text-sm" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {episode.title}
                        </h3>
                      </div>
                      {episode.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {episode.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {episode.is_free ? (
                      <span className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full shadow-sm animate-pulse">
                        مجاني / Free
                      </span>
                    ) : canPlay ? (
                      <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full flex items-center gap-1">
                        <FaCheckCircle className="text-xs" /> متاحة للمشاهدة
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full flex items-center gap-1">
                        <FaLock className="text-xs" /> يتطلب اشتراك
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            {t("overviewCourse.noEpisodes", "لا توجد دروس متاحة حالياً لهذا الكورس")}
          </p>
        )}
      </div>
    </div>
  );
}

export default OverviewCourse;
