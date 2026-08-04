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
  // "kicked" = طرد بسبب دخول من جهاز آخر | "expired" = انتهاء الجلسة
  const [sessionKickReason, setSessionKickReason] = useState(null);

  const clearAuthStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleLogin = async (email, password) => {
    try {
      // Clear any previous kick reason before new login attempt
      localStorage.removeItem("session_kick_reason");

      const deviceId = getDeviceIdentifier();
      const deviceInfo = getDeviceInfo();

      const res = await login(email, password, deviceId, deviceInfo);

      const payload = res?.data || res;
      const currentUser = payload?.user;
      const userToken = payload?.token;

      if (!currentUser) {
        const errorMsg =
          typeof res?.message === "object"
            ? res.message.ar || res.message.en
            : res?.message || "فشل تسجيل الدخول: لم يتم استلام بيانات المستخدم";
        throw new Error(errorMsg);
      }

      setUser(currentUser);
      setToken(userToken);
      setSessionExpired(false);
      setSessionKickReason(null);
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
    setSessionExpired(false);
    setSessionKickReason(null);
    clearAuthStorage();
    navigate("/auth/login");
  };

  /**
   * Called when the server returns 401 on an authenticated request.
   * reason: "kicked" | "expired"
   */
  const handleSessionExpired = (reason = "expired") => {
    setSessionExpired(true);
    setSessionKickReason(reason);
    setUser(null);
    setToken(null);
    clearAuthStorage();
    // Persist reason so the login page can read it on mount
    localStorage.setItem("session_kick_reason", reason);

    setTimeout(() => {
      navigate("/auth/login");
    }, 100);
  };

  // Setup global fetch interceptor for 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && token) {
        const url = args[0];
        const API_BASE = import.meta.env.VITE_API_BASE;

        // Only intercept our API calls, not login itself
        if (
          typeof url === "string" &&
          url.includes(API_BASE) &&
          !url.includes("/auth/login")
        ) {
          // Try to read error body to distinguish "kicked" vs "expired"
          try {
            const cloned = response.clone();
            const body = await cloned.json().catch(() => ({}));
            const msg =
              typeof body?.message === "object"
                ? body.message.ar || body.message.en || ""
                : body?.message || "";

            // Check if it's a "kicked by another device" scenario
            const isKicked =
              msg.includes("جهاز") ||
              msg.includes("device") ||
              msg.includes("kicked") ||
              msg.includes("another") ||
              msg.includes("session");

            handleSessionExpired(isKicked ? "kicked" : "expired");
          } catch {
            handleSessionExpired("expired");
          }
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
    sessionKickReason,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};