import React, { useState, useEffect } from "react";
import {
  FaGripHorizontal,
  FaList,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaClock,
  FaBook,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCourses } from "../../api/courses";
import ImageNotFound from "../../assets/images/ImageNotFound.png";

const RecentCoursesSection = () => {
  const { t, i18n } = useTranslation("common");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      setError(null);
      try {
        const lang = i18n.language || "ar";
        const result = await getCourses(1, 6, lang);
        const data = Array.isArray(result?.data) ? result.data : [];
        // Sort by newest (by id desc as proxy if no created_at)
        const sorted = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
        setCourses(sorted.slice(0, 6));
      } catch (err) {
        console.error("RecentCourses fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [i18n.language]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++)
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400 text-xs" />);
    if (hasHalfStar)
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 text-xs" />);
    for (let i = 0; i < emptyStars; i++)
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400 text-xs" />);

    return stars;
  };

  const getImageUrl = (course) => {
    if (!course?.image) return ImageNotFound;
    if (course.image.startsWith("http")) return course.image;
    const base = import.meta.env.VITE_API_BASE?.replace("/api", "") || "";
    return `${base}/storage/${course.image}`;
  };

  return (
    <section
      id="recent-course-section"
      className={`relative bg-blue-50/10 dark:bg-gray-900 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Top Wave SVG */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
        <path
          fill="#ffffff"
          className="dark:fill-gray-800"
          fillOpacity="1"
          d="M0,224L30,197.3C60,171,120,117,180,128C240,139,300,213,360,250.7C420,288,480,288,540,250.7C600,213,660,139,720,128C780,117,840,171,900,192C960,213,1020,203,1080,181.3C1140,160,1200,128,1260,128C1320,128,1380,160,1410,176L1440,192L1440,0L1410,0C1380,0,1320,0,1260,0C1200,0,1140,0,1080,0C1020,0,960,0,900,0C840,0,780,0,720,0C660,0,600,0,540,0C480,0,420,0,360,0C300,0,240,0,180,0C120,0,60,0,30,0L0,0Z"
        />
      </svg>

      {/* Section Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("recentCourses.title")}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
              {t("recentCourses.subtitle")}
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-600 text-primary shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary"
              }`}
            >
              <FaGripHorizontal />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-600 text-primary shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary"
              }`}
            >
              <FaList />
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="text-primary text-4xl animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <FaExclamationTriangle className="text-4xl text-yellow-400 mb-4" />
            <p className="text-lg">{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-xl">{t("recentCourses.noCourses", { defaultValue: "لا توجد كورسات حالياً" })}</p>
          </div>
        )}

        {/* Courses List / Grid */}
        {!loading && !error && courses.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
                : "flex flex-col gap-6"
            }
          >
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 overflow-hidden flex ${
                  viewMode === "list" ? "flex-row" : "flex-col lg:flex-row"
                }`}
              >
                {/* Thumbnail */}
                <div
                  className={`overflow-hidden flex-shrink-0 ${
                    viewMode === "list" ? "w-40 h-auto" : "w-full lg:w-1/3 h-48 lg:h-auto"
                  }`}
                >
                  <img
                    src={getImageUrl(course)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={course.title || "Course"}
                    onError={(e) => { e.target.src = ImageNotFound; }}
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Category badge */}
                  {course.grade && (
                    <span className="inline-block self-start text-xs px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 font-medium mb-2">
                      {course.grade}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {course.title || "—"}
                  </h3>

                  {/* Description */}
                  {course.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Rating */}
                  {course.rating !== undefined && (
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">{renderStars(course.rating)}</div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ms-1">
                        {Number(course.rating).toFixed(1)}/5
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    {course.lessons_count !== undefined && (
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <FaBook className="text-blue-500" />
                        {course.lessons_count} {t("recentCourses.lessons", { defaultValue: "دروس" })}
                      </span>
                    )}
                    {course.price !== undefined && (
                      <span className="text-sm font-bold text-primary">
                        {Number(course.price) === 0
                          ? t("recentCourses.free", { defaultValue: "مجاني" })
                          : `${Number(course.price).toLocaleString()} ${t("recentCourses.currency", { defaultValue: "ج.م" })}`}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* See All link */}
        {!loading && courses.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-medium shadow-md hover:from-primary hover:to-primary hover:text-white transition-all duration-300"
            >
              {t("recentCourses.more", { defaultValue: "مشاهدة الكل" })}
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Wave SVG */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
        <path
          fill="#ffffff"
          className="dark:fill-gray-800"
          fillOpacity="1"
          d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,112C960,139,1056,181,1152,181.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </section>
  );
};

export default RecentCoursesSection;
