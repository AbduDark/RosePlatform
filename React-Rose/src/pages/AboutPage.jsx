import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFlask, FaGraduationCap, FaCheckCircle, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import AboutImg from "../assets/images/study.svg";

const AboutPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const faqs = [
    {
      question: "ما هي منصة روز أكاديمي؟",
      answer: "روز أكاديمي هي منصة تعليمية إلكترونية متخصصة في تدريس مادة الكيمياء لطلاب الثانوية العامة (الصف الأول والثاني والثالث الثانوي) بأسلوب مبسط وشامل."
    },
    {
      question: "كيف يمكنني الاشتراك في كورسات المنصة؟",
      answer: "يمكنك إنشاء حساب مجاني، ثم اختيار الكورس الخاص بمرحلتك الدراسية وإرسال إيصال الاشتراك ليتم تفعيله من إدارة المنصة فوراً."
    },
    {
      question: "هل تتوفر فيديوهات الشرح في أي وقت؟",
      answer: "نعم، بمجرد تفعيل اشتراكك يمكنك مشاهدة الفيديوهات والتظلمات والتدريبات في أي وقت ومن أي جهاز."
    },
    {
      question: "هل يدعم النظام الحسابات المتعددة على أكثر من جهاز؟",
      answer: "حرصاً على أمان وسرية الحسابات، يُسمح بتسجيل الدخول من جهاز واحد فقط في نفس الوقت لحماية بيانات الطالب وصلاحية اشتراكه."
    }
  ];

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 transition-colors ${isRTL ? "font-arabic" : "font-sans"}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Banner Header */}
      <div className="relative py-14 md:py-20 bg-gradient-to-r from-secondary via-blue-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-4">
            <FaFlask />
            <span>عن أكاديمية روز للكيمياء</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {t("aboutPage.title", { defaultValue: "عن روز أكاديمي" })}
          </h1>
          <p className="text-gray-100 text-base md:text-xl mt-4 max-w-3xl leading-relaxed">
            {t("aboutPage.subtitle", { defaultValue: "المنصة المتخصصة الأولى لتبسيط منهج الكيمياء لطلاب الثانوية العامة، وإعداد الطالب للفهم العميق والتميز في الامتحانات." })}
          </p>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <span className="w-2 h-8 bg-primary rounded-full inline-block" />
              {t("aboutPage.historyTitle", { defaultValue: "رؤيتنا ورسالتنا التعليمية" })}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-4">
              تسعى روز أكاديمي إلى تحويل مادة الكيمياء من مادة صعبة إلى مادة مفهومة وممتعة من خلال تقديم شرح يتناسب مع آليات التفكير الحديثة لطلاب المرحلة الثانوية.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
              نغطي كافة أجزاء المنهج بدءاً من أساسيات الكيمياء، والتفاعلات، وحتى الكيمياء العضوية والكهربية، مع تدريبات مكثفة تضمن استيعاب جميع أفكار الأسئلة.
            </p>

            {/* Quick Feature Bullet Points */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm font-medium">
                <FaCheckCircle className="text-primary text-lg flex-shrink-0" />
                <span>شرح مبسط ومباشر يراعي جميع مستويات الطلاب</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm font-medium">
                <FaCheckCircle className="text-primary text-lg flex-shrink-0" />
                <span>تغطي الكورسات الصف الأول والثاني والثالث الثانوي</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200 text-sm font-medium">
                <FaCheckCircle className="text-primary text-lg flex-shrink-0" />
                <span>منصة سرية وآمنة وتدعم البث بجودة عالية</span>
              </div>
            </div>

            <div>
              <Link to="/contact">
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary to-primary text-white font-bold px-7 py-3 rounded-full text-base shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <span>{t("aboutPage.contactUs", { defaultValue: "تواصل معنا الآن" })}</span>
                  <FaArrowRight className={isRTL ? "rotate-180 text-sm" : "text-sm"} />
                </button>
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <img
                src={AboutImg}
                alt="About us section"
                className="w-full h-auto rounded-xl"
              />
              <div className="mt-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-gray-950 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  <FaGraduationCap />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">أكاديمية روز للكيمياء</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">طريقك الأسهل للتفوق في الكيمياء للثانوية العامة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-14 bg-gray-100 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 text-teal-700 dark:text-primary text-sm font-semibold mb-3">
              <FaQuestionCircle />
              <span>الأسئلة الشائعة</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t("aboutPage.faqTitle", { defaultValue: "أبرز استفسارات الطلاب" })}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-base">
              {t("aboutPage.faqSubtitle", { defaultValue: "إليك إجابات حول أبرز الأسئلة المتعلقة بالاشتراك والدراسة في روز أكاديمي." })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed me-4">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
