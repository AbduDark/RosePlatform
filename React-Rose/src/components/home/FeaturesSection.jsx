import React from "react";
import { motion } from "framer-motion";
import {
  FaKey,
  FaFileAlt,
  FaMedal,
  FaBriefcase,
  FaCrown,
  FaHeadphonesAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t, i18n } = useTranslation("common");
  const features = [
    {
      id: 1,
      icon: <FaKey className="text-4xl" />,
      title: t("features.instantAccess.title"),
      description: t("features.instantAccess.description"),
      offset: "",
    },
    {
      id: 2,
      icon: <FaFileAlt className="text-4xl" />,
      title: t("features.videoLessons.title"),
      description: t("features.videoLessons.description"),
      offset: "md:mt-24",
    },
    {
      id: 3,
      icon: <FaMedal className="text-4xl" />,
      title: t("features.learningSupport.title"),
      description: t("features.learningSupport.description"),
      offset: "md:mt-48",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

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

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
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
      className={`py-20 bg-gray-50 dark:bg-gray-800 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4">
        <motion.div
          className={`max-w-4xl mx-auto mb-16 ${
            i18n.language === "ar" ? "text-right" : "text-left"
          }`}
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900 dark:text-white">
            {t("features.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">{t("features.subtitle")}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={`${feature.offset}`}
              variants={cardVariants}
            >
              <motion.div
                className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-md h-full hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Gradient background overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mb-6"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h4 className="text-xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
