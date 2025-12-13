"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import AnimatedDropdownSelect from "@/components/pages/transactions/ui/FormSelect";
import Link from "next/link";

type ContactOption = {
  value: string | number;
  label: string;
  type?: "user";
};

const sources = {
  customer: "/api/contacts/?type=customer",
  vendor: "/api/contacts/?type=vendor",
  shareholder: "/api/contacts/?type=shareholder",
} as const;

export default function ContactField() {
  const { control, watch, setValue } = useFormContext();
  const contactType = watch("contact_type") as keyof typeof sources | undefined;
  const [options, setOptions] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ تابع fetchContacts رو بیرون useEffect آوردیم
  const fetchContacts = useCallback(
    async (searchTerm: string = "") => {
      if (!contactType) return;

      setLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const url = `${API_URL}${
          sources[contactType]
        }&limit=10&search=${encodeURIComponent(searchTerm)}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          notify("error", "خطا در دریافت لیست مخاطبان");
          setOptions([]);
          return;
        }

        const json = await res.json();

        const mapped: ContactOption[] = (
          Array.isArray(json.data) ? json.data : []
        ).map((x: any) => ({
          value: x.id,
          label: x.first_name
            ? `${x.first_name} ${x.last_name ?? ""}`.trim()
            : x.title ?? `#${x.id}`,
          type: "user",
        }));

        setOptions(mapped);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          notify("error", err?.message || "مشکلی پیش آمد ❌");
        }
      } finally {
        setLoading(false);
      }
    },
    [API_URL, contactType, notify]
  );

  // هر بار نوع مخاطب عوض شد -> پاکسازی و گرفتن دیتا
  useEffect(() => {
    setValue("contact_id", "");
    setOptions([]);

    if (contactType) {
      fetchContacts();
    }
  }, [contactType, fetchContacts, setValue]);

  return (
    <div className="grid md:grid-cols-2 gap-6 w-2xl">
      {/* نوع مخاطب */}
      <AnimatedDropdownSelect
        name="contact_type"
        control={control}
        label="نوع مخاطب"
        placeholder="انتخاب نوع مخاطب..."
        options={[
          { value: "customer", label: "مشتری" },
          { value: "vendor", label: "فروشنده" },
          { value: "shareholder", label: "سهام‌دار" },
        ]}
      />

      {/* انتخاب مخاطب */}
      {contactType && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <AnimatedDropdownSelect
              name="contact_id"
              control={control}
              label="انتخاب مخاطب"
              placeholder={
                loading
                  ? "در حال بارگذاری..."
                  : options.length
                  ? "انتخاب کنید"
                  : "موردی یافت نشد"
              }
              options={options}
              disabled={loading || options.length === 0}
              onSearch={(term) => fetchContacts(term)}
            />
          </div>

          {/* ✅ فقط وقتی مشتری یا فروشنده انتخاب شده باشه */}
          {(contactType === "customer" || contactType === "vendor") && (
            <Link
              href="/contacts/add"
              className="h-fit px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/90 transition"
            >
              افزودن
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
