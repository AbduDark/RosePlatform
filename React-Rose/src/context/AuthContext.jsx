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
      
      const data = await login(email, password, deviceId, deviceInfo);
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("token", data.data.token);

      if (data.data.user.role === "admin") {
        navigate("/admin/overview");
      } else {
        navigate("/student-dashboard/subscriptions");
      }

      return data;
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

  const value = {
    user,
    token,
    login: handleLogin,
    logout: handleLogout,
    sessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};