"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

interface SubTransactionNotif {
  id: number;
  transaction_id: number;
  amount: number;
  due_date: string;
  is_paid: boolean;
}

const PAGE_SIZE = 20;

const UpcomingSubTransactionsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<SubTransactionNotif[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (page: number) => {
    setLoading(true);
    const token = Cookies.get("auth_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/upcoming-sub?limit=${PAGE_SIZE}&page=${page}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const data = await res.json();
      setNotifications(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 w-full flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">ساب‌تراکنش‌های نزدیک سررسید</h1>

      {loading && <div>در حال بارگذاری...</div>}

      {!loading && notifications.length === 0 && (
        <div>نوتیفیکیشنی وجود ندارد</div>
      )}

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-3 border w-md bg-box rounded flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div>
              <p>
                ساب‌تراکنش #{notif.id} با مبلغ{" "}
                {notif.amount.toLocaleString("fa-IR")} نزدیک سررسید است
              </p>
              <p className="text-xs text-gray-500">
                موعد: {new Date(notif.due_date).toLocaleDateString("fa-IR")}
              </p>
            </div>
            <Link
              href={`/transactions/${notif.transaction_id}`}
              className="text-blue-500 hover:underline"
            >
              مشاهده
            </Link>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded border ${
                p === page
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingSubTransactionsPage;
