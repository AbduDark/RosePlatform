import { useTranslation } from "react-i18next";
import FlagEG from "../../assets/flags/flag-eg.svg";
import FlagUK from "../../assets/flags/flag-uk.svg";

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`group relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 ${className}`}
      aria-label={
        i18n.language === "ar"
          ? "Switch to English"
          : "التبديل إلى العربية"
      }
      title={
        i18n.language === "ar"
          ? "Switch to English"
          : "التبديل إلى العربية"
      }
    >
      {/* Flag Container with Animation */}
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Current Flag */}
        <img
          src={i18n.language === "ar" ? FlagEG : FlagUK}
          alt={i18n.language === "ar" ? "Egypt Flag" : "UK Flag"}
          className="w-6 h-6 object-cover rounded shadow-sm transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Hover Indicator */}
        <div className="absolute inset-0 bg-primary/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Optional Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50 shadow-lg">
        {i18n.language === "ar" ? "English" : "العربية"}
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
      </div>
    </button>
  );
};

export default LanguageSwitcher;