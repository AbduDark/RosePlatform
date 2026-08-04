import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FiShield, FiMonitor, FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";

/**
 * SessionExpiredModal
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {boolean} kickedOut — true means logged in from another device, false means session expired normally
 */
const SessionExpiredModal = ({ isOpen, onClose, kickedOut = false }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md relative"
          >
            {/* Glow backdrop */}
            <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-40 ${kickedOut ? "bg-gradient-to-r from-orange-500 to-red-600" : "bg-gradient-to-r from-purple-600 to-indigo-600"}`} />

            {/* Card */}
            <div className="relative glass-panel rounded-3xl border border-slate-700/60 p-8 shadow-2xl overflow-hidden">
              {/* Subtle grid texture */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

              <div className="relative z-10 text-center space-y-6">
                {/* Icon */}
                <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${kickedOut ? "bg-orange-500/15 border border-orange-500/30" : "bg-purple-500/15 border border-purple-500/30"}`}>
                  {kickedOut ? (
                    <FiMonitor className="text-4xl text-orange-400" />
                  ) : (
                    <FiShield className="text-4xl text-purple-400" />
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">
                    {kickedOut
                      ? isRtl ? "تسجيل دخول من جهاز آخر! 📱" : "Signed In Elsewhere! 📱"
                      : isRtl ? "انتهت صلاحية الجلسة" : "Session Expired"}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {kickedOut
                      ? isRtl
                        ? "تم اكتشاف جلسة نشطة جديدة لحسابك من جهاز أو متصفح مختلف. لأمان حسابك، تم تسجيل خروجك تلقائياً من هذا الجهاز."
                        : "A new active session was detected on your account from a different device or browser. For your security, you've been automatically signed out."
                      : isRtl
                        ? "انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً للمتابعة."
                        : "Your session has expired. Please sign in again to continue."}
                  </p>
                </div>

                {/* Notice box */}
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-start ${kickedOut ? "bg-orange-500/10 border border-orange-500/20" : "bg-indigo-500/10 border border-indigo-500/20"}`}>
                  <FiAlertTriangle className={`flex-shrink-0 mt-0.5 ${kickedOut ? "text-orange-400" : "text-indigo-400"}`} />
                  <p className="text-xs leading-relaxed text-slate-300">
                    {isRtl
                      ? "🛡️ سياسة الأمان: يُسمح بجلسة نشطة واحدة فقط لكل حساب في أي وقت. إذا كنت أنت من سجّل الدخول، تجاهل هذه الرسالة وتابع من الجهاز الجديد."
                      : "🛡️ Security Policy: Only one active session is allowed per account at any time. If this was you on another device, simply continue from there."}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  to="/auth/login"
                  onClick={onClose}
                  className="block w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-base shadow-xl hover:shadow-purple-700/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
                >
                  {isRtl ? "تسجيل الدخول مجدداً" : "Sign In Again"}
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionExpiredModal;
