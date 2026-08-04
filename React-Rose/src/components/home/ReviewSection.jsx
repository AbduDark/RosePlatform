import React, { useState, useRef } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
} from "react-icons/fa";
import { reviews } from "../../../public/data/data";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const ReviewSection = () => {
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.language === "ar";
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const slideRef = useRef(null);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < fullStars; i++) stars.push(<FaStar key={`f-${i}`} className="text-amber-400" />);
    if (hasHalfStar) stars.push(<FaStarHalfAlt key="h" className="text-amber-400" />);
    for (let i = 0; i < emptyStars; i++) stars.push(<FaRegStar key={`e-${i}`} className="text-amber-400/40" />);
    return stars;
  };

  const nextReview = () => setActiveIndex((p) => (p === reviews.length - 1 ? 0 : p + 1));
  const prevReview = () => setActiveIndex((p) => (p === 0 ? reviews.length - 1 : p - 1));

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) nextReview();
    if (touchStart - touchEnd < -75) prevReview();
  };

  const activeReview = reviews[activeIndex];

  return (
    <section
      id="reviews-section"
      className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden"
      dir="ltr"
    >
      {/* Background Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {isRtl ? "آراء طلابنا" : "Student Testimonials"}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t("reviewSection.title", "ماذا يقول طلابنا")}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            {t("reviewSection.subtitle", "اكتشف تجارب حقيقية من طلاب حققوا تفوقًا ملموسًا على منصتنا.")}
          </p>
        </motion.div>

        {/* Big Stats Strip */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-14">
          {[
            { value: "5,000+", label: isRtl ? "طالب مسجّل" : "Enrolled Students" },
            { value: "4.9/5", label: isRtl ? "متوسط التقييم" : "Average Rating" },
            { value: "99%", label: isRtl ? "نسبة رضا الطلاب" : "Satisfaction Rate" },
          ].map((stat, i) => (
            <div key={i} className="text-center glass-card rounded-2xl p-4 border border-slate-800">
              <div className="text-2xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Review Carousel */}
        <div className="relative max-w-3xl mx-auto">

          {/* Nav Arrow Left */}
          <button
            onClick={prevReview}
            className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-2xl glass-panel border border-slate-700 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <FaChevronLeft />
          </button>

          {/* Review Card */}
          <div
            className="overflow-hidden"
            ref={slideRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative p-8 sm:p-10 rounded-3xl glass-card border border-slate-800 hover:border-purple-500/30 transition-all duration-300"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 end-8 text-purple-500/20">
                  <FaQuoteLeft className="text-5xl" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {renderStars(activeReview.rating)}
                  <span className="text-sm text-slate-400 ms-2 font-medium">{activeReview.rating}/5</span>
                </div>

                {/* Review Text */}
                <p
                  className="text-lg text-slate-300 leading-relaxed mb-8 italic font-light"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  {activeReview.text}
                </p>

                {/* Reviewer Profile */}
                <div className="flex items-center gap-4">
                  <img
                    src={activeReview.avatar}
                    alt={activeReview.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/30"
                  />
                  <div>
                    <h4 className="font-bold text-white text-base">{activeReview.name}</h4>
                    <p className="text-purple-400 text-sm font-medium">{activeReview.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Arrow Right */}
          <button
            onClick={nextReview}
            className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-2xl glass-panel border border-slate-700 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <FaChevronRight />
          </button>

          {/* Dot Navigation */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-8 h-2 bg-purple-500"
                    : "w-2 h-2 bg-slate-700 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ReviewSection;