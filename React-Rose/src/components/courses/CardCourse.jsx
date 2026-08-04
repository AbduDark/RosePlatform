import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaStar, FaStarHalfAlt, FaRegStar, FaClock } from "react-icons/fa";
import { FiHeart, FiPlay } from "react-icons/fi";
import { useCourse } from "../../context/CourseContext";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../common/Loader";
import i18next from "i18next";
import ImageNotFound from "../../assets/images/ImageNotFound.png";
import Pagination from "../common/Pagination";
import { useAuth } from "../../context/AuthContext";
import { addToFavorites, removeFromFavorites, getFavoriteSubscriptions } from "../../api/favorites";
import { getMySubscriptions, renewSubscription } from "../../api/subscriptions";
import SubscriptionStatusModal from "../common/SubscriptionStatusModal";
import RenewSubscriptionModal from "../user/RenewSubscriptionModal";
import IntroVideoModal from "../common/IntroVideoModal";

function CardCourse() {
  const { t } = useTranslation();
  const { courses, loading, error, page, setPage, meta } = useCourse();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [favoriteCourseIds, setFavoriteCourseIds] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(null);
  const [renewError, setRenewError] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedIntroVideo, setSelectedIntroVideo] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const GRADE_MAP = {
    "الاول": "أولى ثانوي",
    "الثاني": "تانية ثانوي",
    "الثالث": "تالتة ثانوي",
  };

  const GRADE_COLORS = {
    "الاول": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "الثاني": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "الثالث": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      try {
        const currentLang = i18next.language || 'ar';
        const data = await getFavoriteSubscriptions(token, currentLang);
        const subscriptions = data?.data?.subscriptions || data?.data?.favorites || data?.subscriptions || data?.favorites || [];
        const favoriteIds = subscriptions.map(sub => sub.course_id);
        setFavoriteCourseIds(favoriteIds);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };
    fetchFavorites();
  }, [token]);

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleOpenRenewModal = async () => {
    try {
      const currentLang = i18next.language || 'ar';
      const response = await getMySubscriptions(token, currentLang);
      const subscriptions = response?.data?.subscriptions || response?.subscriptions || [];
      const subscription = subscriptions.find(sub => sub.course_id === selectedCourseId);
      
      if (subscription) {
        setSelectedSubscription(subscription);
        setShowRenewModal(true);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleRenewSubscription = async (formData) => {
    setRenewLoading(true);
    setRenewError(null);
    setRenewSuccess(null);
    
    try {
      const currentLang = i18next.language || 'ar';
      const submitData = new FormData();
      submitData.append('subscription_id', selectedSubscription.id);
      submitData.append('vodafone_number', formData.vodafone_number);
      submitData.append('parent_phone', formData.parent_phone);
      if (formData.payment_proof instanceof File) {
        submitData.append('payment_proof', formData.payment_proof);
      }

      await renewSubscription(token, submitData, currentLang);
      setRenewSuccess(t("mySubscriptions.renewSuccess"));
      setShowRenewModal(false);
      setSelectedSubscription(null);

      setTimeout(() => {
        setRenewSuccess(null);
        navigate("/student-dashboard/subscriptions");
      }, 2000);
    } catch (err) {
      setRenewError(err.message || t("common.error"));
    } finally {
      setRenewLoading(false);
    }
  };

  const handleToggleFavorite = async (e, courseId) => {
    e.stopPropagation();
    if (!token) {
      navigate("/auth/login");
      return;
    }

    setFavoriteLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const currentLang = i18next.language || 'ar';
      const isFavorite = favoriteCourseIds.includes(courseId);
      if (isFavorite) {
        await removeFromFavorites(token, courseId, currentLang);
        setFavoriteCourseIds(prev => prev.filter(id => id !== courseId));
      } else {
        await addToFavorites(token, courseId, currentLang);
        setFavoriteCourseIds(prev => [...prev, courseId]);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleShowIntro = (e, introVideoUrl, courseTitle) => {
    e.stopPropagation();
    setSelectedIntroVideo(introVideoUrl);
    setSelectedCourseTitle(courseTitle);
    setShowIntroModal(true);
  };

  const renderStars = (rating) => {
    if (!rating)
      return <span className="text-gray-400">{t("cardCourse.noRating")}</span>;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };


  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-center my-9 text-red-600">
        {t("cardCourse.error")}
      </div>
    );

  const gradeFilterOptions = [
    { value: "all", label: "كل الصفوف" },
    { value: "الاول", label: "أولى ثانوي" },
    { value: "الثاني", label: "تانية ثانوي" },
    { value: "الثالث", label: "تالتة ثانوي" },
  ];

  const filteredCourses = courses.filter(course => {
    if (!course.grade) return true;
    if (gradeFilter !== "all") return course.grade === gradeFilter;
    return true;
  });


  return (
    <>
      <IntroVideoModal
        isOpen={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        videoUrl={selectedIntroVideo}
        courseTitle={selectedCourseTitle}
      />
      
      <SubscriptionStatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        status={modalStatus}
        courseId={selectedCourseId}
        onRenew={handleOpenRenewModal}
      />
      
      <RenewSubscriptionModal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleRenewSubscription}
        loading={renewLoading}
        courseName={selectedSubscription?.course?.title}
      />

      {renewSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {renewSuccess}
        </div>
      )}

      {renewError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {renewError}
        </div>
      )}

      <div className="container mx-auto py-8 px-4">
        {/* Grade Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {gradeFilterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGradeFilter(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                gradeFilter === opt.value
                  ? "bg-gradient-to-r from-secondary to-primary text-white shadow-md scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-semibold">لا توجد دورات لهذا الصف حتى الآن</p>
          </div>
        )}

        <motion.div
          className={`grid grid-cols-1 md:grid-cols-3 3xl:grid-cols-4 gap-6`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleCourseClick(course.id)}
              className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900 cursor-pointer relative border border-transparent dark:border-gray-600"
            >
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                {course.intro_video_url && course.intro_video_url.trim() !== '' && (
                  <motion.button
                    onClick={(e) => handleShowIntro(e, course.intro_video_url, course.title)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-blue-500/90 hover:bg-blue-600 text-white transition-all shadow-lg"
                    title={t("introVideo.watchIntro") || "شاهد المقدمة"}
                  >
                    <FiPlay className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button
                  onClick={(e) => handleToggleFavorite(e, course.id)}
                  disabled={favoriteLoading[course.id]}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 transition-all ${
                    token && favoriteCourseIds.includes(course.id) ? "text-red-500" : "text-gray-400 dark:text-gray-300"
                  } ${favoriteLoading[course.id] ? "opacity-50" : ""}`}
                  title={token && favoriteCourseIds.includes(course.id) ? t("favorites.removeFromFavorites") || "إزالة من المفضلة" : t("favorites.addToFavorites") || "إضافة للمفضلة"}
                >
                  <FiHeart className={`w-5 h-5 ${token && favoriteCourseIds.includes(course.id) ? "fill-current" : ""}`} />
                </motion.button>
              </div>
              <motion.img
                src={course.image_url || ImageNotFound}
                alt={course.title}
                className="w-full h-48 object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  {course.grade ? (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${GRADE_COLORS[course.grade] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {GRADE_MAP[course.grade] || course.grade}
                    </span>
                  ) : (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                      كل الصفوف
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">{course.language}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{course.title}</h3>
                <div className="flex items-center mb-3">
                  {renderStars(course.avg_rating)}
                  <span className="text-gray-600 dark:text-gray-300 text-sm ml-2">
                    {course.avg_rating ? `${course.avg_rating}/5` : ""}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {course.description}
                </p>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <FaClock
                      className={`text-red-500 dark:text-red-400 ${
                        i18next.language === "ar" ? "ml-1" : "mr-1"
                      }`}
                    />
                    {course.duration_hours} {t("cardCourse.hours")}
                  </span>
                  <span>
                    {course.lessons_count} {t("cardCourse.lessons")}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {t("cardCourse.instructor")}: {course.instructor_name}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {location.pathname === "/courses" && meta && meta.last_page > 1 && (
        <Pagination page={page} setPage={setPage} pageCount={meta.last_page} />
      )}
    </>
  );
}

export default CardCourse;
