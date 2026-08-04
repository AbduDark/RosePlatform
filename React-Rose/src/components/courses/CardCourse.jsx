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

      <div className="container mx-auto py-12 px-4">
        <motion.div
          className={`grid grid-cols-1 md:grid-cols-3 3xl:grid-cols-4 gap-6`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              variants={cardVariants}
              onClick={() => handleCourseClick(course.id)}
              className="group relative rounded-3xl overflow-hidden cursor-pointer border border-slate-800 bg-slate-900/60 backdrop-blur-sm hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {/* Course Image with Overlay */}
              <div className="relative h-52 overflow-hidden">
                <motion.img
                  src={course.image_url || ImageNotFound}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 0.4 }}
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                {/* Top Action Buttons */}
                <div className="absolute top-3 end-3 z-10 flex gap-2">
                  {course.intro_video_url && course.intro_video_url.trim() !== '' && (
                    <motion.button
                      onClick={(e) => handleShowIntro(e, course.intro_video_url, course.title)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 transition-all"
                      title={t("introVideo.watchIntro") || "شاهد المقدمة"}
                    >
                      <FiPlay className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={(e) => handleToggleFavorite(e, course.id)}
                    disabled={favoriteLoading[course.id]}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-slate-700 hover:border-rose-500/50 transition-all ${
                      token && favoriteCourseIds.includes(course.id) ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
                    } ${favoriteLoading[course.id] ? "opacity-50" : ""}`}
                  >
                    <FiHeart className={`w-4 h-4 ${token && favoriteCourseIds.includes(course.id) ? "fill-current" : ""}`} />
                  </motion.button>
                </div>

                {/* Bottom price/level badge */}
                <div className="absolute bottom-3 start-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600/80 text-purple-100 border border-purple-500/40 backdrop-blur-sm">
                    {course.level}
                  </span>
                  {course.price == 0 ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/80 text-emerald-100 border border-emerald-400/40 backdrop-blur-sm">
                      {i18next.language === 'ar' ? 'مجاني' : 'Free'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/80 text-amber-100 border border-amber-400/40 backdrop-blur-sm">
                      {i18next.language === 'ar' ? 'مدفوع' : 'Paid'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1">
                {/* Stars */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center gap-0.5">{renderStars(course.avg_rating)}</div>
                  <span className="text-slate-400 text-xs font-medium">
                    {course.avg_rating ? `${course.avg_rating}/5` : (i18next.language === 'ar' ? 'لا يوجد تقييم' : 'No rating')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                  {course.description}
                </p>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FaClock className="text-purple-400" />
                      {course.duration_hours} {t("cardCourse.hours")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-400">▶</span>
                      {course.lessons_count} {t("cardCourse.lessons")}
                    </span>
                  </div>
                  <span className="text-xs text-purple-400 font-medium truncate max-w-24">
                    {course.instructor_name}
                  </span>
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
