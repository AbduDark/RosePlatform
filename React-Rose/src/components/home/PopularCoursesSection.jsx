import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaGraduationCap } from "react-icons/fa";
import { Link } from "react-router-dom";
import CardCourse from "../courses/CardCourse";
import { useTranslation } from "react-i18next";

const PopularCoursesSection = () => {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.language === "ar";

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      id="popular-course-section"
      className={`py-12 bg-gray-50/50 dark:bg-gray-900/50 ${
        isRTL ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Section head */}
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold mb-3">
            <FaGraduationCap className="text-lg" />
            <span>كورسات المراحل الدراسية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
            {t("popularCourses.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t("popularCourses.subtitle")}
          </p>
        </motion.div>
      </div>

      {/* Courses */}
      <div className="container mx-auto px-4">
        <CardCourse />
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-indigo-600 text-white px-8 py-3.5 text-lg font-bold shadow-lg hover:shadow-rose-500/25 hover:scale-105 transition-all duration-300"
          >
            <span>{t("popularCourses.more")}</span>
            <FaArrowRight className={isRTL ? "rotate-180" : ""} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularCoursesSection;
