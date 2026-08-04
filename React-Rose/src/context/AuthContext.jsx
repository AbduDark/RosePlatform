import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { login, logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { getDeviceIdentifier, getDeviceInfo } from "../utils/deviceIdentifier";

const API_BASE = import.meta.env.VITE_API_BASE;
const AUTH_CONTEXT = createContext();

export const useAuth = () => {
  const context = useContext(AUTH_CONTEXT);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [sessionExpired, setSessionExpired] = useState(false);
  const [kickedOut, setKickedOut] = useState(false); // Logged in from another device
  const pollingRef = useRef(null);

  // ─── Session Validation via Profile Ping ──────────────────────────────────
  const checkSessionValid = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: "application/json",
        },
      });

      if (res.status === 401) {
        // Token was invalidated by another login
        clearAuthData();
        setKickedOut(true);
        setSessionExpired(true);
        setTimeout(() => navigate("/auth/login"), 150);
      }
    } catch (_) {
      // Network error — don't log out, just skip this cycle
    }
  };

  // Start polling every 45 seconds when user is logged in
  useEffect(() => {
    if (token) {
      pollingRef.current = setInterval(checkSessionValid, 45_000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [token]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ─── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (email, password) => {
    try {
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
            : res?.message || "فشل تسجيل الدخول";
        throw new Error(errorMsg);
      }

      setUser(currentUser);
      setToken(userToken);
      setKickedOut(false);
      setSessionExpired(false);
      localStorage.setItem("user", JSON.stringify(currentUser));
      if (userToken) localStorage.setItem("token", userToken);

      if (currentUser.role === "admin") {
        navigate("/admin/overview");
      } else {
        navigate("/student-dashboard/subscriptions");
      }

      return res;
    } catch (error) {
      throw error;
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logout(token);
    } catch (_) {}
    clearAuthData();
    navigate("/auth/login");
  };

  // ─── Expired session (401 interceptor) ────────────────────────────────────
  const handleSessionExpired = () => {
    clearAuthData();
    setSessionExpired(true);
    setTimeout(() => navigate("/auth/login"), 100);
  };

  // ─── Global 401 Interceptor ───────────────────────────────────────────────
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : "";
        const isApiCall = url.includes(API_BASE);
        const isLoginCall = url.includes("/auth/login") || url.includes("/auth/register");

        if (isApiCall && !isLoginCall && token) {
          handleSessionExpired();
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  // ─── setAuthData (used by register flow) ──────────────────────────────────
  const setAuthData = (currentUser, userToken, redirectPath = "/") => {
    setUser(currentUser);
    setToken(userToken);
    setKickedOut(false);
    setSessionExpired(false);
    localStorage.setItem("user", JSON.stringify(currentUser));
    if (userToken) localStorage.setItem("token", userToken);
    navigate(redirectPath);
  };

  const value = {
    user,
    token,
    login: handleLogin,
    logout: handleLogout,
    setAuthData,
    sessionExpired,
    kickedOut,
  };

  return <AUTH_CONTEXT.Provider value={value}>{children}</AUTH_CONTEXT.Provider>;
};