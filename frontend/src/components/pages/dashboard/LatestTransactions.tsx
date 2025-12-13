"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

interface ApiTransaction {
  id: number;
  amount: number;
  transaction_date: string;
  is_paid: boolean;
  transaction_type: "income" | "expense";
}

interface Transaction {
  id: number;
  description: string;
  amount: string;
  date: string;
  status: "پرداخت شده" | "پرداخت نشده";
  type: "income" | "expense";
}

const LatestTransactions = ({ token }: { token: string }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/latest?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;

      const apiData: ApiTransaction[] = await res.json();

      const mapped: Transaction[] = apiData?.map((tx) => ({
        description:
          tx.transaction_type === "income"
            ? "دریافت وجه"
            : tx.transaction_type === "expense"
            ? "پرداخت هزینه"
            : "سهام/سود",
        amount: tx.amount.toLocaleString(),
        date: new Date(tx.transaction_date).toLocaleDateString("fa-IR"),
        status: tx.is_paid ? "پرداخت شده" : "پرداخت نشده",
        type: tx.transaction_type,
        id: tx.id,
      }));

      setTransactions(mapped);
    };

    fetchTransactions();
  }, [token]);

  return (
    <div className="w-full p-4 bg-box rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">آخرین تراکنش‌ها</h2>
        <Link href="/transactions" className="text-blue-500 text-sm">
          مشاهده همه &larr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-separate border-spacing-y-2">
          <thead>
            <tr className="text-sm text-gray-500 flex justify-between">
              <th className="px-4 py-2">توضیحات</th>
              <th className="px-4 py-2">مقدار</th>
              <th className="px-4 py-2">تاریخ</th>
              <th className="px-4 py-2">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {transactions &&
              transactions.map((tx, idx) => (
                <tr key={idx} className="text-sm font-medium">
                  <td
                    colSpan={4}
                    className={`px-4 py-2 rounded-md ${
                      tx.type === "income"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : tx.type === "expense"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                    }`}
                  >
                    <Link href={`/transactions/${tx.id}`}>
                      <div className="flex justify-between">
                        <span>{tx.description}</span>
                        <span>{tx.amount} ريال</span>
                        <span>{tx.date}</span>
                        <span>{tx.status}</span>
                      </div>
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LatestTransactions;
