import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaSignInAlt, FaPlay } from "react-icons/fa";
import HeaderImg from "../../assets/images/intro-art.svg";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

const IntroSection = () => {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      id="intro-section"
      className={`w-full pt-16 bg-gradient-to-r from-secondary to-primary dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-center text-white">
          {/* Intro Content */}
          <motion.div
            className="w-full lg:w-1/2 mb-12 lg:mb-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4"
              dangerouslySetInnerHTML={{
                __html: t("introSection.title", {
                  span: (text) =>
                    `<span class="text-yellow-400">${text}</span>`,
                }),
              }}
            />
            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl font-medium mb-6 text-gray-100"
            >
              {t("introSection.description")}
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/courses"
                className="relative inline-flex items-center rounded-full border-2 border-yellow-400 text-yellow-400 px-8 py-3 text-lg font-medium shadow-md hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 ease-in-out"
              >
                {i18n.language === "ar" ? (
                  <>
                    <FaArrowRight className="ml-2" />
                    {t("introSection.startCourse")}
                  </>
                ) : (
                  <>
                    {t("introSection.startCourse")}
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </Link>

              {!user && (
                <Link
                  to="/auth/register"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900 px-8 py-3 lg:text-lg font-medium shadow-md hover:bg-primary hover:from-transparent hover:to-transparent hover:text-white transition-all duration-300 ease-in-out"
                >
                  {t("introSection.signup", { defaultValue: "Signup" })}
                  <FaSignInAlt
                    className={i18n.language === "ar" ? "mr-2" : "ml-2"}
                  />
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Video Box */}
          <motion.div
            className="hidden md:flex lg:w-1/3 relative"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            <img
              src={HeaderImg}
              alt={t("introSection.imageAlt", { defaultValue: "Introduction" })}
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </div>

      {/* Wave SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 310"
        className="w-full block leading-none"
      >
        <path
          fill="#FFFFFF"
          className="dark:fill-gray-900"
          fillOpacity="1"
          d="M0,256L48,240C96,224,192,192,288,154.7C384,117,480,75,576,96C672,117,768,203,864,197.3C960,192,1056,96,1152,69.3C1248,43,1344,85,1392,106.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </section>
  );
};

export default IntroSection;
