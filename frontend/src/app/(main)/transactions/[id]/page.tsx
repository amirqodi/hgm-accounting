"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import {
  formatDate,
  formatNumber,
  formatTransactionType,
  formatPaymentMethod,
} from "@/utils/formatters";

type Transaction = {
  id: number;
  contact: { first_name: string; last_name: string };
  category: { name: string };
  transaction_type: "income" | "expense";
  amount: number;
  payment_method: string;
  transaction_date: string;
  due_date?: string | null;
  notes?: string;
  attachments?: { id: number; file_name: string; file_path: string }[];
  sub_transactions: {
    id: number;
    amount: number;
    due_date?: string;
    is_paid: boolean;
  }[];
};

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const { notify, refreshNotifications } = useNotification();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${id}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("خطا در دریافت اطلاعات تراکنش");

        const json = await res.json();
        setTransaction(json);
      } catch (err: any) {
        notify("error", err.error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, notify]);

  const markSubTransactionPaid = async (subId: number) => {
    if (!transaction) return;
    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/sub/${subId}/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("خطا در پرداخت قسط");

      // آپدیت محلی state
      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              sub_transactions: prev.sub_transactions.map((sub) =>
                sub.id === subId ? { ...sub, is_paid: true } : sub
              ),
            }
          : prev
      );

      notify("success", "قسط با موفقیت پرداخت شد ✅");
      refreshNotifications();
    } catch (err: any) {
      notify("error", err.error);
    }
  };

  if (loading) return <p>در حال بارگذاری...</p>;
  if (!transaction) return <p>تراکنش پیدا نشد</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        جزئیات تراکنش #{transaction.id}
      </h1>

      <div className="grid grid-cols-2 gap-4 bg-box p-4 rounded-lg shadow">
        <p>
          <span className="font-semibold">طرف حساب: </span>
          {transaction.contact.first_name} {transaction.contact.last_name}
        </p>
        <p>
          <span className="font-semibold">دسته‌بندی: </span>
          {transaction.category.name}
        </p>
        <p>
          <span className="font-semibold">نوع تراکنش: </span>
          {formatTransactionType(transaction.transaction_type)}
        </p>
        <p>
          <span className="font-semibold">مبلغ: </span>
          {formatNumber(transaction.amount)}
        </p>
        <p>
          <span className="font-semibold">روش پرداخت: </span>
          {formatPaymentMethod(transaction.payment_method)}
        </p>
        <p>
          <span className="font-semibold">تاریخ تراکنش: </span>
          {formatDate(transaction.transaction_date)}
        </p>
        <p>
          <span className="font-semibold">سررسید: </span>
          {formatDate(transaction.due_date)}
        </p>
        <p>
          <span className="font-semibold">یادداشت: </span>
          {transaction.notes || "-"}
        </p>
      </div>

      {transaction.attachments && transaction.attachments.length > 0 && (
        <div className="bg-box p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">پیوست‌ها</h3>
          <ul>
            {transaction.attachments.map((att) => (
              <li key={att.id}>
                <a
                  href={process.env.NEXT_PUBLIC_API_URL + att.file_path}
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  {att.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-box p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">اقساط / ساب‌تراکنش‌ها</h3>
        <ul className="space-y-2">
          {transaction.sub_transactions &&
            transaction.sub_transactions.map((sub) => (
              <li
                key={sub.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <span className="font-semibold">مبلغ: </span>
                  {formatNumber(sub.amount)}{" "}
                  <span className="font-semibold">سررسید: </span>
                  {formatDate(sub.due_date)}
                </div>
                <button
                  className={`px-3 py-1 rounded ${
                    sub.is_paid
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-black"
                  }`}
                  onClick={() => !sub.is_paid && markSubTransactionPaid(sub.id)}
                >
                  {sub.is_paid ? "پرداخت شد" : "پرداخت نشده"}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
