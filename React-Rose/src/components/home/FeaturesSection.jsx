import React from "react";
import { motion } from "framer-motion";
import {
  FaBolt,
  FaVideo,
  FaGraduationCap,
  FaShieldAlt,
  FaComments,
  FaMobileAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.language === "ar";

  const features = [
    {
      id: 1,
      icon: <FaBolt className="text-3xl text-amber-400" />,
      title: isRtl ? "وصول فوري وتلقائي" : "Instant Automatic Access",
      description: isRtl
        ? "بمجرد الاشتراك أو التسجيل، يمكنك مشاهدة دروسك مباشرة دون انتظار أو تعقيدات."
        : "Start learning instantly after subscribing with zero waiting time or friction.",
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      borderColor: "group-hover:border-amber-500/50",
    },
    {
      id: 2,
      icon: <FaVideo className="text-3xl text-purple-400" />,
      title: isRtl ? "بث HLS مشفر وسريع" : "High-Speed HLS Streaming",
      description: isRtl
        ? "تقنية بث HLS فائقة السرعة تضمن لك مشاهدة الفيديوهات بجودة عالية وبدون تقطيع."
        : "Powered by modern HLS streaming technology for uninterrupted, crystal-clear playback.",
      gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
      borderColor: "group-hover:border-purple-500/50",
    },
    {
      id: 3,
      icon: <FaGraduationCap className="text-3xl text-emerald-400" />,
      title: isRtl ? "منهج مرتب خطوة بخطوة" : "Structured Step-by-Step Curriculum",
      description: isRtl
        ? "دروس مرتبة بأسلوب تربوي منظم يضمن لك التدرج من الفهم البسيط حتى إتقان المادة."
        : "Carefully structured curriculum designed to build your knowledge systematically.",
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "group-hover:border-emerald-500/50",
    },
    {
      id: 4,
      icon: <FaComments className="text-3xl text-cyan-400" />,
      title: isRtl ? "مناقشات وأسئلة تفاعلية" : "Interactive Comments & Q&A",
      description: isRtl
        ? "أضف تعليقاتك واستفساراتك أسفل كل درس واحصل على إجابات ومتابعة من المحاضر."
        : "Ask questions, share comments under lessons, and interact directly with instructors.",
      gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
      borderColor: "group-hover:border-cyan-500/50",
    },
    {
      id: 5,
      icon: <FaShieldAlt className="text-3xl text-indigo-400" />,
      title: isRtl ? "حماية وأمان كامل" : "Protected Content & Security",
      description: isRtl
        ? "نظام حماية متطور يضمن خصوصية المحتوى وتجربة تعلّم آمنة موثوقة لكل طالب."
        : "Advanced security protocols ensuring content protection and reliable user privacy.",
      gradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
      borderColor: "group-hover:border-indigo-500/50",
    },
    {
      id: 6,
      icon: <FaMobileAlt className="text-3xl text-rose-400" />,
      title: isRtl ? "متوافق مع كتل الأجهزة" : "Fully Mobile Responsive",
      description: isRtl
        ? "تصفّح وشاهد دروسك من هاتفك المحمول أو التابلت أو الكمبيوتر بكل سلاسة."
        : "Study on any device—mobile, tablet, or desktop—with adaptive layout responsiveness.",
      gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
      borderColor: "group-hover:border-rose-500/50",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section
      id="features-section"
      className="py-24 bg-slate-950 relative overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Background Subtle Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {isRtl ? "لماذا تختار منصتنا؟" : "Why Choose Rose Academy?"}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {t("features.title", "مميزات منصتنا التعليمية")}
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
            {t(
              "features.subtitle",
              "كل ما تحتاجه للتفوق في مكان واحد: دروس HLS فائقة السرعة، شروحات مبسطة، وتجربة تعلّم رقمية متكاملة."
            )}
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={cardVariants}>
              <div
                className={`group relative h-full p-8 rounded-3xl glass-card glass-card-hover border border-slate-800 transition-all duration-300 flex flex-col justify-between ${feature.borderColor}`}
              >
                {/* Subtle Hover Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10 space-y-5">
                  {/* Icon Badge */}
                  <div className="w-14 h-14 rounded-2xl glass-panel border border-slate-700/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>{isRtl ? "اكتشف المزيد" : "Learn More"}</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default FeaturesSection;
