import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaSignInAlt, FaFlask, FaGraduationCap, FaCheckCircle, FaAtom, FaBookOpen } from "react-icons/fa";
import HeaderImg from "../../assets/images/intro-art.svg";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

const IntroSection = () => {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      id="intro-section"
      className={`w-full pt-10 md:pt-14 bg-gradient-to-r from-secondary via-blue-700 to-teal-800 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950 text-white relative overflow-hidden ${
        isRTL ? "font-arabic" : "font-sans"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          {/* Intro Content */}
          <motion.div
            className="w-full lg:w-7/12 mb-8 lg:mb-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Specialty Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-5 shadow-sm"
            >
              <FaFlask className="text-primary animate-pulse text-sm" />
              <span>{t("introSection.badge", { defaultValue: "🧪 المنصة المتخصصة الأولى في الكيمياء للثانوية العامة" })}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug sm:leading-tight mb-5"
            >
              {isRTL ? (
                <>
                  افهم <span className="text-primary font-black underline decoration-secondary decoration-2">الكيمياء</span> ببساطة واتقن المنهج مع روز أكاديمي 🌹
                </>
              ) : (
                <>
                  Master <span className="text-primary font-bold">Chemistry</span> for High School with Rose Academy
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-gray-100 font-normal mb-6 leading-relaxed max-w-2xl"
            >
              شرح مبسط وعميق لمنهج الكيمياء لطلاب الصف الأول والثاني والثالث الثانوي، مع تدريبات وتطبيقات عملي على الكيمياء العضوية والكهربية بدون تعقيد.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-2.5 mb-7 text-xs sm:text-sm"
            >
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white font-medium">
                <FaCheckCircle className="text-primary" />
                <span>الشرح للنظام الجديد 2025</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white font-medium">
                <FaAtom className="text-primary animate-spin-slow" />
                <span>الكيمياء العضوية والكهربية</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white font-medium">
                <FaBookOpen className="text-yellow-300" />
                <span>شروحات وتدريبات شاملة</span>
              </span>
            </motion.div>

            {/* Call to Actions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3.5"
            >
              <Link
                to="/courses"
                className="inline-flex items-center gap-2.5 rounded-full bg-primary text-gray-950 px-7 py-3 text-base font-bold shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
              >
                <span>{t("introSection.startCourse")}</span>
                <FaArrowRight className={isRTL ? "rotate-180 text-sm" : "text-sm"} />
              </Link>

              {!user && (
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white px-6 py-3 text-base font-medium hover:bg-white/25 transition-all duration-300"
                >
                  <span>{t("introSection.signup", { defaultValue: "أنشئ حسابك مجاناً" })}</span>
                  <FaSignInAlt className="text-sm" />
                </Link>
              )}
            </motion.div>

            {/* Secondary Badge for Thanaweya Grades */}
            <motion.div variants={itemVariants} className="mt-7 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-gray-200">
              <span className="font-bold text-primary">المراحل الدراسية:</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الأول الثانوي</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الثاني الثانوي</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الثالث الثانوي</span>
            </motion.div>
          </motion.div>

          {/* Right Visual / Graphic */}
          <motion.div
            className="w-full lg:w-5/12 relative flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md">
              {/* Background Glass Card with Chemistry Theme */}
              <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl p-5 shadow-2xl">
                <img
                  src={HeaderImg}
                  alt={t("introSection.imageAlt", { defaultValue: "أكاديمية روز للكيمياء" })}
                  className="w-full h-auto drop-shadow-xl"
                />

                {/* Floating Chemistry Badge 1 */}
                <div className="absolute top-4 left-4 bg-gray-950/85 backdrop-blur-md border border-primary/40 text-white p-2.5 rounded-xl shadow-lg flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-base">
                    🧪
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">متخصصون في</div>
                    <div className="text-xs font-bold text-white">كيمياء الثانوية العامة</div>
                  </div>
                </div>

                {/* Floating Chemistry Badge 2 */}
                <div className="absolute bottom-5 right-4 bg-gray-950/85 backdrop-blur-md border border-secondary/40 text-white p-2.5 rounded-xl shadow-lg flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary text-base">
                    <FaGraduationCap />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">منهج منظم</div>
                    <div className="text-xs font-bold text-white">شرح وتدريبات أونلاين</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 310"
        className="w-full block leading-none mt-6"
      >
        <path
          fill="#FFFFFF"
          className="dark:fill-gray-900"
          fillOpacity="1"
          d="M0,256L48,240C96,224,192,192,288,154.7C384,117,480,75,576,96C672,117,768,203,864,197.3C960,192,1056,96,1152,69.3C1248,43,1344,85,1392,106.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </section>
  );
};

export default IntroSection;
