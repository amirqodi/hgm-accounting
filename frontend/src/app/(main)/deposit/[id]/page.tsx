"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter, useParams } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";
import { formatDate, formatNumber } from "@/utils/formatters";

type Deposit = {
  id: number;
  contact: { id: number; first_name: string; last_name: string };
  money_source_type: "cash" | "bank";
  type: "received" | "paid";
  amount: number;
  notes: string;
  created_at: string;
  status: "pending" | "completed";
};

export default function DepositDetailPage() {
  const { id } = useParams(); // گرفتن id از URL
  const depositId = Number(id); // تبدیل به عدد
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();
  const router = useRouter();

  const fetchDeposit = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits/${depositId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("خطا در دریافت ودیعه");
      const json = await res.json();
      setDeposit(json);
    } catch (err: any) {
      notify("error", err.message || "مشکلی پیش آمد");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!deposit) return;
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits/${deposit.id}/pay`,
        {
          method: "PUT", // PUT چون توی API همین روش تعریف شده
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("پرداخت ودیعه موفق نبود");
      const json = await res.json();
      setDeposit(json);
      notify("success", "ودیعه پرداخت شد ✅");
    } catch (err: any) {
      notify("error", err.message || "خطا در پرداخت ودیعه");
    }
  };

  const handleDelete = async () => {
    if (!deposit) return;
    if (!confirm("آیا مطمئن هستید که می‌خواهید این ودیعه را حذف کنید؟")) return;

    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits/${deposit.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("حذف ودیعه موفق نبود");
      notify("success", "ودیعه حذف شد ✅");
      router.push("/deposits");
    } catch (err: any) {
      notify("error", err.message || "خطا در حذف ودیعه");
    }
  };

  useEffect(() => {
    if (!depositId) return;
    fetchDeposit();
  }, [depositId]);

  if (loading) return <p>در حال بارگذاری...</p>;
  if (!deposit) return <p>ودیعه‌ای یافت نشد</p>;

  return (
    <div className="p-6 bg-box rounded-xl shadow max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">جزئیات ودیعه #{deposit.id}</h1>
      <p>
        <strong>طرف حساب:</strong> {deposit.contact.first_name}{" "}
        {deposit.contact.last_name}
      </p>
      <p>
        <strong>نوع ودیعه:</strong>{" "}
        {deposit.type === "received" ? "دریافتی" : "پرداختی"}
      </p>
      <p>
        <strong>منبع پول:</strong>{" "}
        {deposit.money_source_type === "cash" ? "تنخواه" : "بانک"}
      </p>
      <p>
        <strong>مبلغ:</strong> {formatNumber(deposit.amount)}
      </p>
      <p>
        <strong>وضعیت:</strong>{" "}
        {deposit.status === "completed" ? "پرداخت شده" : "در انتظار پرداخت"}
      </p>
      <p>
        <strong>یادداشت:</strong> {deposit.notes || "-"}
      </p>
      <p>
        <strong>تاریخ ایجاد:</strong> {formatDate(deposit.created_at)}
      </p>

      {deposit.status !== "completed" && (
        <button
          onClick={handlePay}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          پرداخت ودیعه
        </button>
      )}
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        حذف ودیعه
      </button>
    </div>
  );
}
