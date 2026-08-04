import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit, FiMenu, FiX, FiVideo, FiHeart } from "react-icons/fi";
import EditProfile from "../components/user/EditProfile";
import { getProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import ChangePassword from "../components/user/ChangePassword";
import { TbLockPassword } from "react-icons/tb";
import Loader from "../components/common/Loader";
import MySubscriptions from "../components/user/MySubscriptions";
import MyFavorites from "../components/user/MyFavorites";
import { useNavigate, useParams } from "react-router-dom";
import i18next from "i18next";

const StudentDashboardPage = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const { tab } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const currentTab = menuItems.find((item) => item.path === tab);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else {
      navigate(`${menuItems[0].path}`, { replace: true });
    }
  }, [tab]);
  const fetchUserData = async () => {
    if (!token) {
      setError(t("studentDashboard.noAuthToken"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(token);
      setProfile(data);
    } catch (error) {
      setError(error.message || t("studentDashboard.failedToLoadProfile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const menuItems = [
    {
      id: 1,
      label: t("studentDashboard.courses"),
      icon: <FiVideo className="w-5 h-5" />,
      component: <MySubscriptions />,
      path: "subscriptions",
    },
    {
      id: 2,
      label: t("favorites.title") || "المفضلات",
      icon: <FiHeart className="w-5 h-5" />,
      component: <MyFavorites />,
      path: "favorites",
    },
    {
      id: 3,
      label: t("studentDashboard.editProfile"),
      icon: <FiEdit className="w-5 h-5" />,
      component: <EditProfile profile={profile} onUpdate={fetchUserData} />,
      path: "profile",
    },
    {
      id: 4,
      label: t("studentDashboard.changePassword"),
      icon: <TbLockPassword className="w-5 h-5" />,
      component: <ChangePassword />,
      path: "change-password",
    },
  ];

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleTabChange = (item) => {
    setActiveTab(item.id);
    navigate(`/student-dashboard/${item.path}`);
    if (window.innerWidth < 768) {
      setMenuOpen(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center my-9 text-red-600 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4">
        <p className="text-gray-500 dark:text-gray-400">{t("studentDashboard.noProfileData")}</p>
      </div>
    );
  }

  const ActiveComponent = menuItems.find(
    (item) => item.id === activeTab
  )?.component;

  return (
    <section className={`relative pb-12 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors ${i18next.language === "ar" ? "font-arabic" : "font-sans"}`}>
      {/* Top Banner Gradient */}
      <div className="h-36 bg-gradient-to-r from-secondary via-blue-700 to-teal-800 relative">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      </div>

      {/* Profile Head Card */}
      <div className="-mt-14 mb-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1 border-4 border-primary/40 shadow-md overflow-hidden flex-shrink-0">
                {profile?.image || profile?.image_url ? (
                  <img
                    src={profile.image_url || profile.image}
                    alt={profile.name || "User"}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <FaUserCircle className="w-full h-full text-gray-300 dark:text-gray-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-start">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                      {profile?.name || "المستخدم"}
                    </h2>
                    <p className="text-sm text-primary font-semibold mt-1">
                      {profile?.email || ""}
                    </p>
                    {profile?.grade && (
                      <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                        {profile.grade === "الاول" ? "الصف الأول الثانوي" :
                         profile.grade === "الثاني" ? "الصف الثاني الثانوي" :
                         profile.grade === "الثالث" ? "الصف الثالث الثانوي" :
                         profile.grade}
                      </span>
                    )}
                  </div>
                  <div className="md:hidden self-center sm:self-start">
                    <button
                      onClick={toggleMenu}
                      className="p-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      {menuOpen ? (
                        <FiX className="w-5 h-5" />
                      ) : (
                        <FiMenu className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap -mx-3">
          {/* Sidebar Navigation */}
          {menuOpen && (
            <div className="w-full md:w-1/4 px-3 mb-6">
              <div className="rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-xl border border-gray-100 dark:border-gray-700">
                <nav>
                  <ul className="space-y-1.5">
                    {menuItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleTabChange(item)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-secondary to-primary text-white shadow-md"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                            }`}
                          >
                            <span className={isActive ? "text-white" : "text-primary"}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          )}
          <div className={`px-3 ${menuOpen ? "w-full md:w-3/4" : "w-full"}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 min-h-[400px]">
              {ActiveComponent || <p className="text-gray-700 dark:text-gray-300">{t("studentDashboard.selectTabToView")}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentDashboardPage;