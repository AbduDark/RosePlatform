import React from "react";
import { useTranslation } from "react-i18next";
import { FaFlask, FaGraduationCap } from "react-icons/fa";

function HeaderAllCourses() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const title = t("headerAllCourses.title", { defaultValue: "دورات الكيمياء للثانوية العامة" });
  const subtitle = t("headerAllCourses.subtitle", {
    defaultValue:
      "استكشف كافة دورات وحصص مادة الكيمياء المقررة لطلاب الصف الأول والثاني والثالث الثانوي وابدأ رحلتك نحو التفوق.",
  });

  return (
    <section
      id="intro-section"
      className={`w-full pt-12 md:pt-16 bg-gradient-to-r from-secondary via-blue-700 to-teal-800 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950 text-white relative overflow-hidden transition-colors ${
        isRTL ? "font-arabic" : "font-sans"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center text-white py-4">
          <div className="w-full lg:w-3/4 mb-6 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-4">
              <FaFlask className="text-primary" />
              <span>أكاديمية روز للكيمياء</span>
            </div>
            <h1 className="text-3xl md:text-5xl text-white font-bold mb-3">
              {title}
            </h1>
            <p className="text-base sm:text-xl font-normal text-gray-100 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          </div>
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
}

export default HeaderAllCourses;
