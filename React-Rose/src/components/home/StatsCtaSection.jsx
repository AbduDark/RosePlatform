import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGraduationCap, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext.jsx";

const StatsCtaSection = () => {
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();

  const stats = [
    {
      value: "+5,000",
      labelAr: "طالب مسجّل",
      labelEn: "Students Enrolled",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
    {
      value: "+20",
      labelAr: "كورس تعليمي",
      labelEn: "Courses Available",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      value: "+500",
      labelAr: "درس فيديو HLS",
      labelEn: "HLS Video Lessons",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      value: "4.9★",
      labelAr: "متوسط تقييم المنصة",
      labelEn: "Average Platform Rating",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
    },
  ];

  return (
    <section
      className="py-24 bg-slate-950 relative overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-purple-900/5 to-slate-950/0 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className={`p-6 rounded-3xl glass-card border ${stat.border} text-center transition-all duration-300 hover:${stat.bg}`}
            >
              <div className={`text-4xl sm:text-5xl font-black ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                {isRtl ? stat.labelAr : stat.labelEn}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#7c3aed15_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed15_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl" />

          <div className="relative z-10 px-8 sm:px-14 py-14 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-start">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <FaGraduationCap className="text-purple-300 text-2xl" />
                <span className="text-purple-300 text-sm font-semibold tracking-wide uppercase">
                  {isRtl ? "انضم إلى أسرتنا" : "Join Our Community"}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {isRtl
                  ? "ابدأ رحلتك نحو التفوق اليوم وانضم لآلاف الطلاب المتفوقين"
                  : "Start your journey to excellence today and join thousands of top students"}
              </h3>
              <p className="text-purple-200 text-base opacity-80">
                {isRtl
                  ? "سجّل الآن مجانًا واحصل على وصول فوري لمئات الدروس."
                  : "Sign up for free now and get instant access to hundreds of lessons."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              {!user ? (
                <>
                  <Link
                    to="/auth/register"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-purple-700 font-bold text-base shadow-xl hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all duration-300 group"
                  >
                    <span>{isRtl ? "أنشئ حسابك الآن" : "Create Free Account"}</span>
                    {isRtl ? <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> : <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                  >
                    {isRtl ? "استعرض الدورات" : "Browse Courses"}
                  </Link>
                </>
              ) : (
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-purple-700 font-bold text-base shadow-xl hover:bg-purple-50 hover:scale-105 transition-all duration-300 group"
                >
                  <span>{isRtl ? "استعرض الدورات الآن" : "Explore Courses Now"}</span>
                  {isRtl ? <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> : <FaArrowRight className="group-hover:translate-x-1 transition-transform" />}
                </Link>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default StatsCtaSection;
