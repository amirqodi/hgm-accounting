// app/bank-accounts/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import EditBankForm from "@/components/pages/bank/EditBankForm";
import { useNotification } from "@/components/main/NotificationProvider";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  card_number: string;
  iban: string;
  balance: string;
};

export default function EditBankAccountPage() {
  const { id } = useParams(); // id حساب
  const { notify } = useNotification();

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = Cookies.get("auth_token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            credentials: "include",
          }
        );

        if (!res.ok) notify("error", "خطا در دریافت اطلاعات حساب");

        const json = await res.json();
        setAccount(json);
      } catch (err) {
        if (err instanceof Error) {
          notify("error", err.message || "مشکلی پیش آمد ❌");
        } else {
          notify("error", "مشکلی پیش آمد ❌");
        }
      }
    };

    fetchAccount();
  }, [id, notify]);

  if (loading) return <p className="p-4">در حال بارگذاری...</p>;
  if (!account) return <p className="p-4">حساب پیدا نشد</p>;

  return (
    <div className="flex w-full justify-center flex-col items-center">
      <h1 className="text-xl font-bold mb-4">ویرایش حساب بانکی</h1>
      <EditBankForm />
    </div>
  );
}
