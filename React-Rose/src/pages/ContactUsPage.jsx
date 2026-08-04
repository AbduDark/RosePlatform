import React from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaHeadset, FaPaperPlane } from "react-icons/fa";

const ContactUsPage = () => {
  const { t } = useTranslation();
  const isRTL = i18next.language === "ar";

  return (
    <div className={`relative bg-gray-50 dark:bg-gray-900 transition-colors min-h-screen ${isRTL ? "font-arabic" : "font-sans"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Banner Header */}
      <div className="relative py-14 md:py-20 bg-gradient-to-r from-secondary via-blue-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-4">
            <FaHeadset />
            <span>الدعم الفني والخدمة</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {t("contactPage.title", { defaultValue: "تواصل معنا" })}
          </h1>
          <p className="text-gray-100 text-base md:text-xl mt-4 max-w-3xl leading-relaxed">
            {t("contactPage.subtitle", { defaultValue: "نحن هنا لمساعدتك والإجابة على أي استفسارات تخص الاشتراك والدراسة في روز أكاديمي." })}
          </p>
        </div>
      </div>

      {/* Main Contact Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3 border-b dark:border-gray-700 pb-4">
            <span className="w-2.5 h-8 bg-primary rounded-full" />
            {t("contactPage.contactInfo", { defaultValue: "معلومات الاتصال المباشرة" })}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {/* Phone Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl mb-4">
                <FaPhoneAlt />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {t("contactPage.phone", { defaultValue: "الهاتف / الواتساب" })}
              </h3>
              <a
                href="tel:+201008187344"
                dir="ltr"
                className="text-primary font-bold text-base hover:underline"
              >
                +20 100 818 7344
              </a>
            </div>

            {/* Email Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl mb-4">
                <FaEnvelope />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {t("contactPage.email", { defaultValue: "البريد الإلكتروني" })}
              </h3>
              <a
                href="mailto:rose.academy50@gmail.com"
                className="text-gray-600 dark:text-gray-300 text-sm hover:text-primary transition-colors truncate max-w-full"
              >
                rose.academy50@gmail.com
              </a>
            </div>

            {/* Location Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl mb-4">
                <FaMapMarkerAlt />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {t("contactPage.location", { defaultValue: "العنوان" })}
              </h3>
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                الغربية، جمهورية مصر العربية
              </span>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="p-6 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">هل لديك استفسار عاجل حول الاشتراكات؟</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">تواصل مع الدعم عبر الواتساب للحصول على إجابة فورية.</p>
            </div>
            <a
              href="https://wa.me/201008187344"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-primary text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-md hover:scale-105 transition-all flex-shrink-0"
            >
              <FaPaperPlane />
              <span>تواصل عبر الواتساب</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
