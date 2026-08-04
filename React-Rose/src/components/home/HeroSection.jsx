import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaSignInAlt, FaFlask, FaGraduationCap, FaCheckCircle, FaAtom } from "react-icons/fa";
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
      id="intro-section"
      className={`w-full pt-12 md:pt-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-950 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 text-white relative overflow-hidden ${
        isRTL ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Glow effects in background */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Intro Content */}
          <motion.div
            className="w-full lg:w-7/12 mb-12 lg:mb-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Egyptian Chemistry Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-sm font-semibold mb-6 shadow-lg"
            >
              <FaFlask className="text-yellow-400 animate-pulse text-base" />
              <span>{t("introSection.badge", { defaultValue: "🧪 المنصة المتخصصة الأولى في الكيمياء للثانوية العامة" })}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              {isRTL ? (
                <>
                  تقفيل <span className="text-yellow-400 underline decoration-rose-500 decoration-wavy">الكيمياء</span> أسهل مما تتخيل مع روز أكاديمي 🌹
                </>
              ) : (
                <>
                  Master <span className="text-yellow-400">Chemistry</span> for High School with Rose Academy
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl md:text-2xl text-gray-200 font-normal mb-8 leading-relaxed max-w-2xl"
            >
              {t("introSection.description")}
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 mb-8 text-sm sm:text-base"
            >
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white">
                <FaCheckCircle className="text-green-400" />
                <span>الشرح بالنظام الجديد 2025</span>
              </span>
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white">
                <FaAtom className="text-cyan-400 animate-spin-slow" />
                <span>الكيمياء العضوية والكهربية</span>
              </span>
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white">
                <FaGraduationCap className="text-yellow-400" />
                <span>ضمان الـ 60/60</span>
              </span>
            </motion.div>

            {/* Call to Actions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                to="/courses"
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-950 px-8 py-3.5 text-lg font-bold shadow-xl hover:shadow-yellow-500/20 hover:scale-105 transition-all duration-300"
              >
                <span>{t("introSection.startCourse")}</span>
                <FaArrowRight className={isRTL ? "rotate-180" : ""} />
              </Link>

              {!user && (
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white px-7 py-3.5 text-lg font-medium hover:bg-white/25 transition-all duration-300"
                >
                  <span>{t("introSection.signup", { defaultValue: "أنشئ حسابك مجاناً" })}</span>
                  <FaSignInAlt />
                </Link>
              )}
            </motion.div>

            {/* Secondary Badge for Thanaweya Grades */}
            <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-xs sm:text-sm text-gray-300">
              <span className="font-bold text-yellow-300">المراحل المتاحة:</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الأول الثانوي</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الثاني الثانوي</span>
              <span className="px-2.5 py-1 rounded bg-white/10 font-medium">الصف الثالث الثانوي</span>
            </motion.div>
          </motion.div>

          {/* Right Visual / Graphic */}
          <motion.div
            className="w-full lg:w-5/12 relative flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md">
              {/* Background Glass Card with Chemistry Theme */}
              <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <img
                  src={HeaderImg}
                  alt={t("introSection.imageAlt", { defaultValue: "أكاديمية روز للكيمياء" })}
                  className="w-full h-auto drop-shadow-2xl"
                />

                {/* Floating Chemistry Badge 1 */}
                <div className="absolute top-4 left-4 bg-gray-950/80 backdrop-blur-md border border-rose-500/40 text-white p-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 text-xl font-bold">
                    60
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">هدفنا الدائم</div>
                    <div className="text-sm font-bold text-white">الدرجة النهائية</div>
                  </div>
                </div>

                {/* Floating Chemistry Badge 2 */}
                <div className="absolute bottom-6 right-4 bg-gray-950/80 backdrop-blur-md border border-yellow-500/40 text-white p-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xl">
                    🧪
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">تجارب وحلول</div>
                    <div className="text-sm font-bold text-white">بابل شيت ونظام جديد</div>
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
        className="w-full block leading-none mt-8"
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
