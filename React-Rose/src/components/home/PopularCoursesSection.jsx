import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import CardCourse from "../courses/CardCourse";
import { useTranslation } from "react-i18next";

const PopularCoursesSection = () => {
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.language === "ar";

  return (
    <section
      id="popular-course-section"
      className="py-24 bg-slate-950 relative overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
              {isRtl ? "الأكثر شعبية" : "Most Popular"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t("popularCourses.title", "الكورسات الأكثر شهرة")}
            </h2>
          </div>
          <Link
            to="/courses"
            className="group flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-300 text-sm font-semibold"
          >
            <span>{t("popularCourses.more", "عرض الكل")}</span>
            {isRtl ? (
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            ) : (
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            )}
          </Link>
        </motion.div>

        <motion.p
          className="text-slate-400 text-base mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {t("popularCourses.subtitle", "اكتشف الدورات الأكثر طلبًا وابدأ رحلتك نحو التفوق الآن.")}
        </motion.p>

        {/* Courses Grid */}
        <CardCourse />
      </div>
    </section>
  );
};

export default PopularCoursesSection;
