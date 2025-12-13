"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import BalanceSheetPage from "@/components/pages/reports/BalanceSheet";

type BalanceSheetData = {
  assets: {
    bank_accounts: number;
    cash_holders: number;
    inventory: number;
    receivables: number;
    deposits_received: number;
    total: number;
  };
  liabilities: {
    deposits_paid: number;
    payables: number;
    total: number;
  };
  equity: {
    capital: number;
    retained_earnings: number;
    total: number;
  };
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
};

export default function BalanceSheet() {
  const [data, setData] = useState<BalanceSheetData | null>(null);

  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reports/balance-sheet`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        if (!res.ok) {
          throw new Error("خطا در دریافت داده‌های ترازنامه");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        notify("error", err.error || "مشکلی پیش آمد");
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceSheet();
  }, [notify]);

  if (loading) return <p className="text-center mt-8">در حال بارگذاری...</p>;
  if (!data)
    return (
      <p className="text-center mt-8 text-destructive">داده‌ای موجود نیست!</p>
    );

  return <BalanceSheetPage data={data} />;
}
