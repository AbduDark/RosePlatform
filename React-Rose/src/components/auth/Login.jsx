import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import studyImage from "../../assets/images/study.svg";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

const Login = () => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [kickBanner, setKickBanner] = useState(null); // null | "kicked" | "expired"

  const isRTL = i18n.dir() === 'rtl';

  // Check if user was kicked by another device login
  useEffect(() => {
    const reason = localStorage.getItem("session_kick_reason");
    if (reason) {
      setKickBanner(reason);
      localStorage.removeItem("session_kick_reason");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      if (res && res.success === false) {
        const msg = typeof res.message === 'object'
          ? (res.message.ar || res.message.en)
          : res.message;
        setError(msg || t("auth.login.loginFailed"));
      }
    } catch (error) {
      setError(error.message || t("auth.login.loginFailed"));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-full lg:w-1/2">
          <div className="w-full max-w-[480px] mx-auto p-10 rounded-2xl bg-white dark:bg-gray-700 shadow-2xl border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:shadow-3xl">
            <div className="w-full">
              <header className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-2">
                {t("auth.login.title")}
              </header>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
                {t("auth.login.noAccount")}{" "}
                <Link
                  to="/auth/register"
                  className="text-primary dark:text-primary font-semibold hover:underline"
                >
                  {t("auth.login.signup")}
                </Link>
              </p>

              {/* Session kick banner */}
              {kickBanner === "kicked" && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl flex items-start gap-3">
                  <FaExclamationTriangle className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-700 dark:text-orange-300 font-semibold text-sm">
                      {t("auth.login.kickedTitle", { defaultValue: "تم تسجيل الخروج تلقائياً" })}
                    </p>
                    <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                      {t("auth.login.kickedMessage", { defaultValue: "تم تسجيل الدخول إلى حسابك من جهاز آخر، لذا تم إنهاء جلستك الحالية. إذا لم تكن أنت، يُرجى تغيير كلمة المرور فوراً." })}
                    </p>
                  </div>
                </div>
              )}

              {kickBanner === "expired" && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl flex items-start gap-3">
                  <FaInfoCircle className="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {t("auth.login.sessionExpiredMessage", { defaultValue: "انتهت صلاحية جلستك. يُرجى تسجيل الدخول مرة أخرى." })}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="relative">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder={t("auth.login.email")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                  />
                </div>

                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.login.password")}
                    className="h-12 w-full text-base font-normal rounded-lg outline-none px-4 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all"
                  />
                  <i 
                    className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} transform -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400 cursor-pointer p-1 hover:text-primary transition-colors`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                <div className="text-center">
                  <Link
                    to="/auth/forgot-password"
                    className="text-primary text-sm font-medium hover:underline transition-all"
                  >
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>

                <div className="relative pt-2">
                  <button
                    type="submit"
                    className="h-12 w-full border-none text-base font-semibold rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("auth.login.loginButton")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
            <img 
              src={studyImage} 
              alt="Login illustration" 
              className="relative w-full max-w-lg h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
