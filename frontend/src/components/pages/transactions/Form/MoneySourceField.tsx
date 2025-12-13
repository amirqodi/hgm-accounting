"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import AnimatedDropdownSelect from "@/components/pages/transactions/ui/FormSelect";

type OptionType = {
  id: number | string;
  bank_name?: string;
  card_number?: string;
  first_name?: string;
  last_name?: string;
};

type ResultsType = {
  results: OptionType[];
};

export default function MoneySourceField() {
  const { control, watch } = useFormContext();
  const type = watch("payment_method");
  const [options, setOptions] = useState<
    { value: string | number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!type) return;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const url =
          type === "cash"
            ? `${API_URL}/api/cash-holders/`
            : `${API_URL}/api/bank-accounts/`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          notify("error", "خطا در دریافت منبع پول");
          return;
        }

        const json = await res.json();

        const dataArray: OptionType[] = type === "cash" ? json.results : json; // 👈 اینجا

        const mapped = dataArray.map((opt) => ({
          value: opt.id,
          label:
            type === "card"
              ? `${opt.bank_name} - ${opt.card_number}`
              : `${opt.first_name ?? ""} ${opt.last_name ?? ""}`.trim() ||
                `#${opt.id}`,
          type: type === "card" ? "card" : "user",
        }));

        setOptions(mapped);
      } catch (err: any) {
        notify("error", err.message || "مشکلی پیش آمد ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [type, API_URL]);

  return (
    <div className="grid md:grid-cols-2 gap-6 w-2xl">
      {/* انتخاب روش پرداخت */}
      <AnimatedDropdownSelect
        name="payment_method"
        control={control}
        label="روش پرداخت"
        placeholder="انتخاب روش پرداخت..."
        options={[
          { value: "cash", label: "نقد" },
          { value: "card", label: "کارت" },
        ]}
      />

      {/* انتخاب حساب/تنخواه */}
      {type && (
        <AnimatedDropdownSelect
          name="money_source_id"
          control={control}
          label="انتخاب حساب"
          placeholder={loading ? "در حال بارگذاری..." : "انتخاب کنید"}
          options={options}
          disabled={loading}
        />
      )}
    </div>
  );
}
