"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

type NotificationProps = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
  onClose: (id: number) => void;
};

const colors = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export default function Notification({
  id,
  type,
  message,
  onClose,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 ${colors[type]}`}
    >
      <span>{message}</span>
      <button onClick={() => onClose(id)} className="hover:opacity-80">
        <X size={18} />
      </button>
    </motion.div>
  );
}
