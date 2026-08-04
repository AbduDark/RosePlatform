import React, { useState, useRef, useEffect } from "react";
import {
  FaQuoteLeft,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import ImageNotFound from "../../assets/images/ImageNotFound.png";

const ReviewSection = () => {
  const { t, i18n } = useTranslation("common");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const slideRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  // Fetch reviews from all courses
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // First fetch all courses
        const coursesRes = await fetch(`${API_BASE}/courses?per_page=50`);
        const coursesData = await coursesRes.json();
        const courses = Array.isArray(coursesData?.data)
          ? coursesData.data
          : Array.isArray(coursesData)
          ? coursesData
          : [];

        if (courses.length === 0) {
          setLoading(false);
          return;
        }

        // Then fetch ratings for each course in parallel
        const ratingsPromises = courses.slice(0, 10).map((course) =>
          fetch(`${API_BASE}/courses/${course.id}/ratings`)
            .then((r) => r.json())
            .then((data) => {
              const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
              return list.map((r) => ({ ...r, course_title: course.title }));
            })
            .catch(() => [])
        );

        const allRatings = await Promise.all(ratingsPromises);
        const flatRatings = allRatings.flat();

        // Filter those with actual review text and rating >= 3
        const withReviews = flatRatings.filter(
          (r) => r.review && r.review.trim().length > 10 && (r.rating || 0) >= 3
        );

        // Deduplicate by user_id, keep highest rated
        const byUser = {};
        withReviews.forEach((r) => {
          const uid = r.user_id || r.user?.id;
          if (!uid) return;
          if (!byUser[uid] || (r.rating || 0) > (byUser[uid].rating || 0)) {
            byUser[uid] = r;
          }
        });

        const finalReviews = Object.values(byUser)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10);

        setReviews(finalReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [API_BASE]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++)
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    if (hasHalfStar)
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    for (let i = 0; i < emptyStars; i++)
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);

    return stars;
  };

  const nextReview = () =>
    setActiveIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));

  const prevReview = () =>
    setActiveIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) nextReview();
    if (touchStart - touchEnd < -75) prevReview();
  };

  const getAvatarUrl = (user) => {
    if (!user?.image) return null;
    if (user.image.startsWith("http")) return user.image;
    const base = API_BASE?.replace("/api", "") || "";
    return `${base}/storage/${user.image}`;
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  // Auto-rotate every 5s
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(nextReview, 5000);
    return () => clearInterval(interval);
  }, [reviews.length, activeIndex]);

  return (
    <section
      className={`py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir="ltr"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            {t("reviewSection.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("reviewSection.subtitle")}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <FaSpinner className="text-primary text-4xl animate-spin" />
          </div>
        )}

        {/* No reviews */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-xl">
              {t("reviewSection.noReviews", { defaultValue: "لا توجد تقييمات حتى الآن" })}
            </p>
          </div>
        )}

        {/* Carousel */}
        {!loading && reviews.length > 0 && (
          <div className="relative max-w-4xl mx-auto">
            <div
              className="overflow-hidden touch-pan-y"
              ref={slideRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {reviews.map((review, idx) => {
                  const user = review.user || {};
                  const name = user.name || t("reviewSection.anonymous", { defaultValue: "مجهول" });
                  const avatarUrl = getAvatarUrl(user);

                  return (
                    <div key={review.id || idx} className="w-full flex-shrink-0 px-4 select-none">
                      <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center mb-6">
                          {/* Avatar */}
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              className="w-16 h-16 rounded-full shadow-md border-2 border-primary/20 object-cover mr-4"
                              alt={name}
                              onError={(e) => { e.target.onerror = null; e.target.src = ImageNotFound; }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-gray-950 text-xl font-bold shadow-md mr-4 flex-shrink-0">
                              {getInitials(name)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xl text-gray-900 dark:text-white font-bold">
                              {name}
                            </h4>
                            {review.course_title && (
                              <p className="text-sm text-primary font-medium mt-0.5">
                                {review.course_title}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 italic leading-relaxed">
                          <FaQuoteLeft className="text-primary/20 dark:text-primary/40 text-3xl mb-2" />
                          {review.review}
                        </p>

                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {Number(review.rating).toFixed(1)}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            {reviews.length > 1 && (
              <>
                <button
                  onClick={prevReview}
                  className="hidden md:block absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white dark:bg-gray-700 shadow-lg rounded-full text-primary hover:scale-110 transition-all duration-300"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={nextReview}
                  className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white dark:bg-gray-700 shadow-lg rounded-full text-primary hover:scale-110 transition-all duration-300"
                >
                  <FaChevronRight />
                </button>
              </>
            )}

            {/* Dots */}
            {reviews.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIndex === idx
                        ? "w-6 bg-primary"
                        : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-primary/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;