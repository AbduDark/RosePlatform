import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHeart,
  FaGithub,
} from "react-icons/fa";
import { HiAcademicCap } from "react-icons/hi";
import Logo from "../../assets/images/Rose_Logo.svg";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
  const { t, i18n } = useTranslation("common");
  const { isDark } = useTheme();

  return (
    <footer
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-black dark:to-gray-950 text-white border-t border-gray-700 dark:border-gray-800 ${
        i18n.language === "ar" ? "font-arabic" : "font-['Heebo']"
      }`}
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4 group">
              <div className="relative">
                <img
                  src={Logo}
                  alt="Rose Logo"
                  className={`h-10 w-auto transition-transform duration-300 group-hover:scale-110 ${
                    i18n.language === "ar" ? "ml-3" : "mr-3"
                  }`}
                />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-purple-400 bg-clip-text text-transparent">
                Rose Academy
              </h3>
            </div>
            <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
              {t("footer.aboutDescription")}
            </p>
            <div
              className={`flex items-center gap-3 ${
                i18n.language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <Link
                to="https://wa.me/+201008187344"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/50"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="w-5 h-5" />
              </Link>
              <Link
                to="#"
                className="p-3 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 hover:border-blue-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
                aria-label="Facebook"
              >
                <FaFacebook className="w-5 h-5" />
              </Link>
              <Link
                to="#"
                className="p-3 rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/20 hover:border-sky-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-sky-500/50"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </Link>
              <Link
                to="#"
                className="p-3 rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white border border-pink-500/20 hover:border-pink-500 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <HiAcademicCap className="w-5 h-5" />
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", label: t("footer.home") },
                { to: "/courses", label: t("footer.courses") },
                { to: "/about", label: t("footer.about") },
                { to: "/contact", label: t("footer.contact") },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-300 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              <FaEnvelope className="w-4 h-4" />
              {t("footer.contactInfo")}
            </h4>
            <div className="space-y-4 text-gray-300 dark:text-gray-400">
              <a
                href="mailto:rose.academy50@gmail.com"
                className="flex items-center gap-3 hover:text-primary dark:hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <FaEnvelope className="w-4 h-4" />
                </div>
                <span className="text-sm">rose.academy50@gmail.com</span>
              </a>
              <a
                href="tel:+201008187344"
                className="flex items-center gap-3 hover:text-primary dark:hover:text-primary transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <FaPhone className="w-4 h-4" />
                </div>
                <span className="text-sm">+201008187344</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FaMapMarkerAlt className="w-4 h-4" />
                </div>
                <span className="text-sm">Egypt</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">
              {t("footer.aboutDescription") || "About Rose Academy"}
            </h4>
            <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed mb-4">
              منصة تعليمية مبتكرة لطلاب الثانوية العامة في مصر، نقدم دورات تعليمية متميزة مع محتوى عالي الجودة.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Made with</span>
              <FaHeart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>in Egypt</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 dark:border-gray-800 mt-10 pt-8">
          <div
            className={`flex flex-col md:flex-row justify-between items-center gap-4 ${
              i18n.language === "ar" ? "text-right" : "text-left"
            }`}
          >
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t("footer.copyright")} © {new Date().getFullYear()} Rose Academy. All rights reserved.
            </p>
            <div
              className={`flex items-center gap-6 ${
                i18n.language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <Link
                to="/developer"
                className="text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary text-sm transition-colors flex items-center gap-2"
              >
                <FaGithub className="w-4 h-4" />
                {t("footer.teamDeveloper")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;