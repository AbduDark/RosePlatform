import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaArrowLeft, FaPlay, FaGraduationCap, FaStar, FaUsers, FaVideo } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section
      id="hero-section"
      className="relative w-full min-h-[90vh] pt-28 pb-20 overflow-hidden bg-slate-950 flex items-center"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <motion.div
            className="lg:col-span-7 space-y-8 text-center lg:text-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top Pill Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-purple-500/30 text-purple-300 text-sm font-medium shadow-lg shadow-purple-950/40">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <FaGraduationCap className="text-purple-400 text-base" />
                <span>
                  {isRtl
                    ? "أكاديمية روز التعليمية | المنصة الذكية للتفوق"
                    : "Rose Academy | Smart Path to Academic Excellence"}
                </span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white"
            >
              {isRtl ? (
                <>
                  طريقك الذكي نحو <span className="gradient-text">التفوق والنجاح</span> في الثانوية العامة
                </>
              ) : (
                <>
                  Your Smart Way to <span className="gradient-text">Academic Success</span> in High School
                </>
              )}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              {t(
                "introSection.description",
                "منصة تمنحك شروحات فيديو مبسطة ومنظمة وفق أحدث مناهج الثانوية العامة مع متابعة مستمرة لتحقيق أعلى الدرجات."
              )}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-purple-900/40 hover:shadow-purple-700/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
              >
                <span>{t("introSection.startCourse", "ابدأ التعلم الآن")}</span>
                {isRtl ? (
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                )}
              </Link>

              {!user && (
                <Link
                  to="/auth/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl glass-panel text-slate-200 font-semibold text-lg border border-slate-700/60 hover:border-purple-500/50 hover:bg-slate-800/80 hover:text-white transition-all duration-300"
                >
                  <span>{t("introSection.signup", "أنشئ حسابك مجاناً")}</span>
                </Link>
              )}
            </motion.div>

            {/* Trust Metrics Bar */}
            <motion.div
              variants={itemVariants}
              className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-xl mx-auto lg:mx-0"
            >
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1">
                  +5K <FaUsers className="text-purple-400 text-lg hidden sm:inline" />
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {isRtl ? "طالب نشط" : "Active Students"}
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start border-x border-slate-800/80 px-2 sm:px-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1">
                  4.9 <FaStar className="text-amber-400 text-lg hidden sm:inline" />
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {isRtl ? "تقييم المنصة" : "Platform Rating"}
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-1">
                  100% <FaVideo className="text-emerald-400 text-lg hidden sm:inline" />
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {isRtl ? "دروس HLS عالية الجودة" : "HD HLS Stream"}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual Graphic Column */}
          <motion.div
            className="lg:col-span-5 relative flex justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Glowing Border Card Container */}
            <div className="relative w-full max-w-md lg:max-w-none">
              
              {/* Outer Backdrop Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl blur-xl opacity-50 animate-pulse-slow" />

              {/* Main Card Element */}
              <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-slate-700/60 shadow-2xl overflow-hidden group">
                
                {/* Visual Header Image / Mockup */}
                <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 flex items-center justify-center border border-slate-800">
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" />
                  
                  {/* Play Button Icon */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl shadow-purple-600/60 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <FaPlay className="text-2xl ms-1 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-purple-200 tracking-wide bg-slate-950/80 px-4 py-1.5 rounded-full border border-purple-500/30">
                      {isRtl ? "معاينة البث المباشر High HD" : "Preview HLS HD Stream"}
                    </span>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isRtl ? "شروحات كيمياء وفيزياء وتفاضل" : "Physics & Chemistry Masterclass"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isRtl ? "منهج الثانوية العامة الكامل" : "Comprehensive Curriculum Course"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {isRtl ? "بث HLS جديد" : "HLS Powered"}
                  </span>
                </div>
              </div>

              {/* Floating Badge 1 (Top Left) */}
              <div className="absolute -top-6 -left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl animate-float">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <FaStar className="text-lg" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">{isRtl ? "أفضل منصة" : "Top Rated"}</div>
                  <div className="text-sm font-bold text-white">2026 Edition</div>
                </div>
              </div>

              {/* Floating Badge 2 (Bottom Right) */}
              <div className="absolute -bottom-6 -right-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl animate-float" style={{ animationDelay: "2s" }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FaGraduationCap className="text-lg" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">{isRtl ? "نسبة نجاح" : "Success Rate"}</div>
                  <div className="text-sm font-bold text-white">99.4%</div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
