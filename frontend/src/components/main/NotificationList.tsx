"use client";
import { AnimatePresence, motion } from "framer-motion";
import Notification from "./Alter";

type NotificationItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

type Props = {
  notifications: NotificationItem[];
  onClose: (id: number) => void;
};

export default function NotificationList({ notifications, onClose }: Props) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div key={n.id} layout>
            <Notification {...n} onClose={onClose} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
