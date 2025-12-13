"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import NotificationList from "./NotificationList";

type NotificationType = "success" | "error" | "info";

type NotificationItem = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotificationContextType = {
  notify: (type: NotificationType, message: string) => void;
  refreshNotifications: () => void;
  setFetchNotificationsRef: (fn: () => void) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ref برای نگه داشتن fetchNotifications تابع در Notif
  const fetchNotificationsRef = useRef<(() => void) | undefined>(undefined);

  const setFetchNotificationsRef = useCallback((fn: () => void) => {
    fetchNotificationsRef.current = fn;
  }, []);

  const refreshNotifications = useCallback(() => {
    if (fetchNotificationsRef.current) fetchNotificationsRef.current();
  }, []);

  const notify = useCallback((type: NotificationType, message: string) => {
    setNotifications((prev) => [...prev, { id: Date.now(), type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notify, refreshNotifications, setFetchNotificationsRef }}
    >
      {children}
      <NotificationList
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotification باید داخل NotificationProvider استفاده شود"
    );
  return context;
};
