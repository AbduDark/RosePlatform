import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "../api/notifications";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!token || !user || isLoading) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  }, [token, user, isLoading]);

  const updateUnreadCount = (newCount) => {
    setUnreadCount(newCount);
  };

  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    if (token && user) {
      fetchUnreadCount();
      // Set up interval to refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [token, user, fetchUnreadCount]);

  const value = {
    unreadCount,
    isLoading,
    fetchUnreadCount,
    updateUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};