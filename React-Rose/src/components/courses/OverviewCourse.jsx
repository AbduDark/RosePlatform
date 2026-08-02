import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getCourseById } from "../../api/courses";
import { getLessonsByCourse } from "../../api/lessons";
import { getSubscriptionStatus } from "../../api/subscriptions";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import IntroVideo from "./IntroVideo";

function OverviewCourse() {
  const { t } = useTranslation();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        setCourse(res.data);
        if (token) {
          try {
            const statusRes = await getSubscriptionStatus(token, courseId);
            setSubscriptionStatus(statusRes.data);
            const lessons = await getLessonsByCourse(courseId, token);
            setLesson(lessons?.data?.lessons);
          } catch {
            setSubscriptionStatus(null);
          }
        } else {
          setSubscriptionStatus(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, token]);

  if (loading) {
    return null;
  }

  if (!course) {
    return null;
  }

  const handleEpisodeClick = (episodeId, courseId) => {
    navigate(`/courses/${courseId}/lessons/${episodeId}`);
  };

  return (
    <div>
      {/* Intro Video */}
      {course.intro_video_url && (
        <IntroVideo
          introVideoUrl={course.intro_video_url}
          courseTitle={course.title}
        />
      )}
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t("overviewCourse.description")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">{course.description}</p>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t("overviewCourse.curriculum")}
        </h2>
        {subscriptionStatus?.is_active ? (
          lesson ? (
            <div className="space-y-4">
              {lesson.map((episode) => (
                <div
                  key={episode.id}
                  onClick={() => handleEpisodeClick(episode.id, courseId)}
                  className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 rounded-lg hover:border-primary dark:hover:border-primary cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
                      <FaBook />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{episode.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {episode.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">{t("overviewCourse.noEpisodes")}</p>
          )
        ) : (
          <p className="text-gray-600 dark:text-gray-300">{t("overviewCourse.subscribeToView")}</p>
        )}
      </div>
    </div>
  );
}

export default OverviewCourse;
