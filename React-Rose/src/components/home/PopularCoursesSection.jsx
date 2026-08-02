import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import CardCourse from "../courses/CardCourse";
import { useTranslation } from "react-i18next";

const PopularCoursesSection = () => {
  const { t, i18n } = useTranslation("common");

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
      className={`pb-12 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Section head */}
      <div className="container mx-auto px-4">
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-4 sm:mb-0 text-gray-900 dark:text-white">
            {t("popularCourses.title")}
          </h1>
        </motion.div>
        <motion.p
          className="text-lg text-gray-500 dark:text-gray-400 mb-8"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {t("popularCourses.subtitle")}
        </motion.p>
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
            className="group px-8 py-3 transition-all duration-300 flex items-center mx-auto gap-2 inline-flex items-center rounded-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 px-8 py-3 text-lg font-medium shadow-md hover:bg-primary hover:from-transparent hover:to-transparent hover:text-white transition-all duration-300 ease-in-out "
          >
            {t("popularCourses.more")}
            <FaArrowRight className="transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularCoursesSection;
