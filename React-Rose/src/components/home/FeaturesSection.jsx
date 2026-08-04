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
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: 2,
      icon: <FaFileAlt className="text-4xl" />,
      title: t("features.videoLessons.title"),
      description: t("features.videoLessons.description"),
      gradient: "from-green-400 to-teal-500",
    },
    {
      id: 3,
      icon: <FaMedal className="text-4xl" />,
      title: t("features.learningSupport.title"),
      description: t("features.learningSupport.description"),
      gradient: "from-orange-400 to-pink-500",
    },
    {
      id: 4,
      icon: <FaBriefcase className="text-4xl" />,
      title: t("features.careerReady.title", { defaultValue: "جاهز لسوق العمل" }),
      description: t("features.careerReady.description", { defaultValue: "محتوى متوافق مع متطلبات سوق العمل الحديث" }),
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      id: 5,
      icon: <FaCrown className="text-4xl" />,
      title: t("features.premium.title", { defaultValue: "محتوى احترافي" }),
      description: t("features.premium.description", { defaultValue: "كورسات معدّة من قِبل خبراء ومتخصصين في مجالاتهم" }),
      gradient: "from-purple-500 to-pink-600",
    },
    {
      id: 6,
      icon: <FaHeadphonesAlt className="text-4xl" />,
      title: t("features.support.title", { defaultValue: "دعم فني متواصل" }),
      description: t("features.support.description", { defaultValue: "فريق دعم متاح لمساعدتك في أي وقت" }),
      gradient: "from-cyan-400 to-blue-500",
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={cardVariants}
            >
              <motion.div
                className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md h-full hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group"
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Gradient background overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-md`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h4 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
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
