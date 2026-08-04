import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from "react-icons/fi";
import { FaGraduationCap, FaShieldAlt, FaUsers } from "react-icons/fa";

const Login = () => {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isRtl ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.success === false) {
        const msg =
          typeof res.message === "object"
            ? res.message.ar || res.message.en
            : res.message;
        setError(msg || t("auth.login.loginFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.login.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" dir={isRtl ? "rtl" : "ltr"}>
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-slate-950 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/80 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <FaGraduationCap className="text-white text-lg" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Rose Academy</span>
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white leading-tight">
                {isRtl ? (
                  <>مرحباً بعودتك! 👋<br /><span className="gradient-text">تعلّم بلا حدود</span></>
                ) : (
                  <>Welcome back! 👋<br /><span className="gradient-text">Learn Without Limits</span></>
                )}
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                {isRtl
                  ? "سجّل دخولك للوصول إلى دروسك، شاهد محتواك الحصري، وتابع رحلتك التعليمية."
                  : "Sign in to access your lessons, watch exclusive content, and continue your learning journey."}
              </p>
            </div>

            {/* Trust pills */}
            <div className="flex flex-col gap-3">
              {[
                { icon: <FaUsers className="text-purple-400" />, label: isRtl ? "+5,000 طالب نشط" : "+5,000 Active Students" },
                { icon: <FaShieldAlt className="text-emerald-400" />, label: isRtl ? "جلسة واحدة آمنة لكل حساب" : "One secure session per account" },
                { icon: <FaGraduationCap className="text-amber-400" />, label: isRtl ? "دروس HLS عالية الجودة" : "High-quality HLS lessons" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Rose Academy. {isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-600/80 flex items-center justify-center">
              <FaGraduationCap className="text-white" />
            </div>
            <span className="text-xl font-black text-white">Rose Academy</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">
              {isRtl ? "تسجيل الدخول" : "Sign In"}
            </h1>
            <p className="text-slate-400 text-sm">
              {isRtl ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <Link
                to="/auth/register"
                className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                {isRtl ? "سجّل الآن مجاناً" : "Register for free"}
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <span className="text-red-400 text-lg mt-0.5">⚠</span>
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                {isRtl ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <div className="relative">
                <FiMail className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-slate-400 text-base`} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRtl ? "example@email.com" : "you@example.com"}
                  className={`w-full h-13 bg-slate-900/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all ${isRtl ? "pr-12 pl-4" : "pl-12 pr-4"} py-4`}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                {isRtl ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <FiLock className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-slate-400 text-base`} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-13 bg-slate-900/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all ${isRtl ? "pr-12 pl-12" : "pl-12 pr-12"} py-4`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-4" : "right-4"} text-slate-400 hover:text-white transition-colors`}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className={`flex ${isRtl ? "justify-start" : "justify-end"}`}>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {isRtl ? "نسيت كلمة المرور؟" : "Forgot your password?"}
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-700/50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin text-lg" />
                  <span>{isRtl ? "جاري الدخول..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
              )}
            </button>
          </form>

          {/* Single device notice */}
          <div className="p-4 rounded-2xl bg-indigo-500/8 border border-indigo-500/20">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              🛡️{" "}
              {isRtl
                ? "لأمان حسابك، يُسمح بجلسة نشطة واحدة فقط في أي وقت. تسجيل الدخول من جهاز جديد سيُنهي الجلسة السابقة تلقائياً."
                : "For your security, only one active session is allowed. Logging in from a new device will automatically end any previous session."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
