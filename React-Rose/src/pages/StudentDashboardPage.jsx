import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit, FiMenu, FiX, FiVideo, FiHeart, FiLogOut,
  FiChevronRight, FiChevronLeft, FiUser
} from "react-icons/fi";
import { FaGraduationCap, FaShieldAlt, FaUserCircle } from "react-icons/fa";
import { TbLockPassword } from "react-icons/tb";
import EditProfile from "../components/user/EditProfile";
import { getProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "../components/user/ChangePassword";
import MySubscriptions from "../components/user/MySubscriptions";
import MyFavorites from "../components/user/MyFavorites";
import { useNavigate, useParams } from "react-router-dom";
import i18next from "i18next";

const StudentDashboardPage = () => {
  const { t } = useTranslation();
  const isRtl = i18next.language === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const { tab } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 1,
      label: t("studentDashboard.courses") || "دوراتي",
      icon: <FiVideo className="w-5 h-5" />,
      component: <MySubscriptions />,
      path: "subscriptions",
      color: "purple",
    },
    {
      id: 2,
      label: t("favorites.title") || "المفضلات",
      icon: <FiHeart className="w-5 h-5" />,
      component: <MyFavorites />,
      path: "favorites",
      color: "pink",
    },
    {
      id: 3,
      label: t("studentDashboard.editProfile") || "تعديل البروفايل",
      icon: <FiEdit className="w-5 h-5" />,
      component: <EditProfile profile={profile} />,
      path: "profile",
      color: "emerald",
    },
    {
      id: 4,
      label: t("studentDashboard.changePassword") || "تغيير كلمة المرور",
      icon: <TbLockPassword className="w-5 h-5" />,
      component: <ChangePassword />,
      path: "change-password",
      color: "amber",
    },
  ];

  const colorMap = {
    purple: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    pink: "bg-pink-500/15 border-pink-500/30 text-pink-400",
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    amber: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  };

  const activeColorMap = {
    purple: "bg-purple-600 text-white shadow-lg shadow-purple-900/40",
    pink: "bg-pink-600 text-white shadow-lg shadow-pink-900/40",
    emerald: "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40",
    amber: "bg-amber-600 text-white shadow-lg shadow-amber-900/40",
  };

  useEffect(() => {
    const currentTab = menuItems.find((item) => item.path === tab);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else {
      navigate(`/student-dashboard/${menuItems[0].path}`, { replace: true });
    }
  }, [tab]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setError("يرجى تسجيل الدخول");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (err) {
        setError(err.message || "حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const handleTabChange = (item) => {
    setActiveTab(item.id);
    navigate(`/student-dashboard/${item.path}`);
    setMenuOpen(false);
  };

  const activeItem = menuItems.find((item) => item.id === activeTab);
  const ActiveComponent = activeItem?.component;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <FaGraduationCap className="absolute inset-0 m-auto text-purple-400 text-xl" />
          </div>
          <p className="text-slate-400 text-sm">{isRtl ? "جاري تحميل لوحة التحكم..." : "Loading dashboard..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Top hero gradient strip */}
      <div className="relative h-52 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Header info area */}
        <div className="relative z-10 h-full flex items-end pb-0 container mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-5 pb-0 -mb-14 sm:-mb-16">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl border-4 border-slate-950 overflow-hidden bg-slate-800 shadow-xl shadow-black/50">
                {profile?.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-indigo-600/30">
                    <FaUserCircle className="text-4xl sm:text-5xl text-slate-400" />
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-md" />
            </div>

            {/* Name & role */}
            <div className="pb-2">
              <h1 className="text-xl sm:text-2xl font-black text-white truncate max-w-xs">
                {profile?.name || "Student"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                  {isRtl ? "طالب" : "Student"}
                </span>
                {profile?.email && (
                  <span className="text-xs text-slate-400 truncate hidden sm:block">{profile.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="ms-auto mb-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 rounded-xl glass-panel border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            >
              {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

          {/* ── Sidebar Navigation ── */}
          <AnimatePresence>
            {(menuOpen || true) && (
              <motion.aside
                initial={false}
                className={`md:block w-full md:w-64 lg:w-72 flex-shrink-0 ${!menuOpen ? "hidden md:block" : ""}`}
              >
                {/* Profile card mini */}
                <div className="glass-card rounded-3xl border border-slate-800/80 p-5 mb-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                      {profile?.image ? (
                        <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiUser className="text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{profile?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{profile?.phone || profile?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <div className="text-sm font-black text-purple-400">
                        <FaShieldAlt className="mx-auto mb-1" />
                      </div>
                      <p className="text-[10px] text-slate-400">{isRtl ? "حساب محمي" : "Secured"}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <div className="text-sm font-black text-emerald-400">
                        <FaGraduationCap className="mx-auto mb-1" />
                      </div>
                      <p className="text-[10px] text-slate-400">{isRtl ? "طالب نشط" : "Active"}</p>
                    </div>
                  </div>
                </div>

                {/* Nav Items */}
                <nav className="glass-card rounded-3xl border border-slate-800/80 p-3 space-y-1.5">
                  {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                          isActive
                            ? activeColorMap[item.color]
                            : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${isActive ? "bg-white/20 border-white/20" : colorMap[item.color]}`}>
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          isRtl ? <FiChevronLeft className="text-sm opacity-60" /> : <FiChevronRight className="text-sm opacity-60" />
                        )}
                      </button>
                    );
                  })}

                  <div className="pt-1.5 border-t border-slate-800/80">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                        <FiLogOut className="w-4 h-4" />
                      </div>
                      <span>{isRtl ? "تسجيل الخروج" : "Sign Out"}</span>
                    </button>
                  </div>
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Main Panel ── */}
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0 ${activeItem ? colorMap[activeItem.color] : "bg-purple-500/15 border-purple-500/30 text-purple-400"}`}>
                {activeItem?.icon}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{activeItem?.label}</h2>
                <p className="text-xs text-slate-400">
                  {isRtl ? `لوحة التحكم ← ${activeItem?.label}` : `Dashboard → ${activeItem?.label}`}
                </p>
              </div>
            </div>

            {/* Active component */}
            <div className="glass-card rounded-3xl border border-slate-800/80 overflow-hidden">
              {ActiveComponent || (
                <div className="p-12 text-center text-slate-400">
                  {t("studentDashboard.selectTabToView")}
                </div>
              )}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;