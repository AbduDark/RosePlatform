import React, { createContext, useContext, useState, useEffect } from "react";
import { login, logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { getDeviceIdentifier, getDeviceInfo } from "../utils/deviceIdentifier";

const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user"))
  );
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLogin = async (email, password) => {
    try {
      // Get device identifier and info
      const deviceId = getDeviceIdentifier();
      const deviceInfo = getDeviceInfo();
      
      const res = await login(email, password, deviceId, deviceInfo);
      
      // Safely extract user and token supporting both wrapped (res.data) and direct (res) structures
      const payload = res?.data || res;
      const currentUser = payload?.user;
      const userToken = payload?.token;

      if (!currentUser) {
        const errorMsg = typeof res?.message === 'object' 
          ? (res.message.ar || res.message.en) 
          : (res?.message || "فشل تسجيل الدخول: لم يتم استلام بيانات المستخدم");
        throw new Error(errorMsg);
      }

      setUser(currentUser);
      setToken(userToken);
      localStorage.setItem("user", JSON.stringify(currentUser));
      if (userToken) {
        localStorage.setItem("token", userToken);
      }

      if (currentUser.role === "admin") {
        navigate("/admin/overview");
      } else {
        navigate("/student-dashboard/subscriptions");
      }

      return res;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout(token);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  const handleSessionExpired = () => {
    setSessionExpired(true);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Show notification and redirect after delay
    setTimeout(() => {
      navigate("/auth/login");
    }, 100);
  };

  // Setup global auth interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      if (token) {
        handleSessionExpired();
      }
    };

    // Intercept unauthorized responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        const url = args[0];
        const API_BASE = import.meta.env.VITE_API_BASE;
        
        // Only trigger on API calls, not on login
        if (typeof url === 'string' && url.includes(API_BASE) && !url.includes('/auth/login')) {
          handleUnauthorized();
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token, navigate]);

  const setAuthData = (currentUser, userToken, redirectPath = "/") => {
    setUser(currentUser);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(currentUser));
    if (userToken) {
      localStorage.setItem("token", userToken);
    }
    navigate(redirectPath);
  };

  const value = {
    user,
    token,
    login: handleLogin,
    logout: handleLogout,
    setAuthData,
    sessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};