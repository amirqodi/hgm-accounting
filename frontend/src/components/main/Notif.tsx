"use client";

import React, { useEffect, useState, useRef } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import Link from "next/link";
import { useNotification } from "./NotificationProvider";
import Cookies from "js-cookie";

interface SubTransactionNotif {
  id: number;
  transaction_id: number;
  amount: number;
  due_date: string;
  is_paid: boolean;
}

const Notif: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SubTransactionNotif[]>([]);
  const [total, setTotal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { notify, setFetchNotificationsRef } = useNotification();

  const fetchNotifications = async () => {
    console.log("[Notif] Fetching notifications...");

    const token = Cookies.get("auth_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/upcoming-sub?limit=9`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        notify("error", "لطفا مجددا وارد حساب شوید");
        return;
      }

      const data = await res.json();
      console.log("[Notif] Fetched notifications:", data.data);
      setNotifications(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("[Notif] Fetch error:", err);
    }
  };

  useEffect(() => {
    // فقط fetch اولیه
    fetchNotifications();
    setFetchNotificationsRef(fetchNotifications);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return (
    <div className="relative" ref={ref}>
      <IoMdNotificationsOutline
        className="text-2xl cursor-pointer"
        onClick={() => setOpen(!open)}
      />
      {total > 0 && (
        <span className="absolute top-[-6px] right-[-6px] min-w-[18px] h-4 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {total < 9 ? total : "9+"}
        </span>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-box shadow-lg rounded-lg z-50">
          <div className="p-2 text-foreground font-bold border-b dark:border-gray-700">
            نوتیفیکیشن‌ها
          </div>

          {notifications.length === 0 && (
            <div className="p-2 text-foreground">نوتیفیکیشنی وجود ندارد</div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-2 border-b dark:border-foreground hover:bg-background flex justify-between items-center"
            >
              <div>
                <p className="text-sm text-foreground">
                  ساب‌تراکنش #{notif.id} با مبلغ{" "}
                  {notif.amount.toLocaleString("fa-IR")} نزدیک سررسید است
                </p>
                <p className="text-xs text-muted">
                  موعد: {new Date(notif.due_date).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <Link
                href={`/transactions/${notif.transaction_id}`}
                className="text-blue-500 text-sm hover:underline"
              >
                مشاهده
              </Link>
            </div>
          ))}

          {total > 9 && (
            <div className="p-2 text-center">
              <Link
                href="/transactions/upcoming"
                className="text-blue-500 text-sm hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notif;
