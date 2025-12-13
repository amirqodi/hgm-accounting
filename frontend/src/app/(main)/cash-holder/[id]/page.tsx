"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditCashHolderForm from "@/components/pages/cash-holder/EditCashHolderForm";
import { useNotification } from "@/components/main/NotificationProvider";

type UserData = {
  first_name: string;
  last_name: string;
  phone_number: string;
};

export default function EditCashHolderPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = Number(params.id); // فرض بر این است که مسیر /cash-holders/[id]/edit است

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((c) => c.startsWith("auth_token="))
          ?.split("=")[1];

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cash-holders/${userId}/`,
          {
            method: "GET",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!res.ok) {
          notify("error", "خطا در دریافت اطلاعات تنخواه");
          return;
        }

        const json = await res.json();
        setUserData(json);
      } catch (err: any) {
        notify("error", err.error || "مشکلی پیش آمد");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, notify]);

  if (loading) return <p className="p-6">در حال بارگذاری...</p>;
  if (!userData) return <p className="p-6 text-red-500">داده‌ای یافت نشد</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">ویرایش تنخواه</h1>
      <EditCashHolderForm defaultValues={userData} userId={userId} />
    </div>
  );
}
