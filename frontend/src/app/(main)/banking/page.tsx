// app/bank-accounts/page.tsx
"use client";
import { useEffect, useState } from "react";
import BankCard from "@/components/pages/bank/BankCard";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import ConfirmModal from "@/components/main/ConfirmModal";
import { useRouter } from "next/navigation";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  card_number: string;
  iban: string;
  balance: string;
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const { notify } = useNotification();

  // state برای کنترل مودال
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const token = Cookies.get("auth_token");

  const router = useRouter();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!res.ok) notify("error", "خطا در دریافت داده‌ها");

        const json = await res.json();
        setAccounts(json);
      } catch (err) {
        if (err instanceof Error) {
          notify("error", err.message || "مشکلی پیش آمد ❌");
        } else {
          notify("error", "مشکلی پیش آمد ❌");
        }
      }
    };

    fetchAccounts();
  }, [notify]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        notify("error", errData?.error || "خطا در حذف حساب بانکی");
        return;
      }

      // حذف از state محلی
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      notify("success", "بانک با موفقیت حذف شد ✅");
    } catch (err: any) {
      notify("error", err.error || "مشکلی پیش آمد");
    }
  };

  // وقتی روی دکمه حذف کلیک میشه
  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  return (
    <div className="flex flex-wrap gap-6 p-6">
      {accounts.map((acc) => (
        <BankCard
          key={acc.id}
          account={acc}
          onEdit={(acc) => router.push(`/banking/${acc.id}`)}
          onDelete={() => confirmDelete(acc.id)} // اول مودال نشون بده
        />
      ))}

      <ConfirmModal
        show={showModal}
        title="حذف حساب بانکی"
        message="آیا از حذف این حساب بانکی مطمئن هستید؟"
        onCancel={() => setShowModal(false)}
        onConfirm={() => {
          if (selectedId) handleDelete(selectedId);
          setShowModal(false);
        }}
      />
    </div>
  );
}
