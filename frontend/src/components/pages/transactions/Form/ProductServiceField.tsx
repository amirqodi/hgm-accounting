"use client";

import { useEffect, useState, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import Cookies from "js-cookie";
import AnimatedDropdownSelect from "@/components/pages/transactions/ui/FormSelect";
import { useNotification } from "@/components/main/NotificationProvider";
import { cn } from "@/lib/utils";

type Option = {
  value: number;
  label: string;
  selling_price: number;
  buying_price?: number;
  stock?: number;
};

export default function ProductServiceField() {
  const { control, watch, setValue } = useFormContext();
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const productId = watch("product_service_id") || "";
  const qty = watch("quantity") || 1;
  const transactionType = watch("transaction_type");

  // ✅ Fetch options with optional search term
  const fetchOptions = useCallback(
    async (searchTerm: string = "") => {
      setLoading(true);
      try {
        const token = Cookies.get("auth_token");

        const res = await fetch(
          `${API_URL}/api/products/all?search=${encodeURIComponent(
            searchTerm
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          notify("error", "خطا در دریافت محصولات و خدمات");
          return;
        }

        const data = await res.json();

        const mapped: Option[] = data.results.map((x: any) => ({
          value: x.id,
          label: x.name ?? `#${x.id}`,
          selling_price: Number(x.selling_price),
          buying_price: Number(x.buying_price),
          stock: x.stock,
        }));

        setOptions(mapped);
      } catch (err: any) {
        notify("error", err?.message || "مشکلی پیش آمد ❌");
      } finally {
        setLoading(false);
      }
    },
    [API_URL, notify]
  );

  // Fetch all options initially
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Update amount when product/service, quantity, or transaction_type changes
  useEffect(() => {
    if (!productId) {
      setValue("amount", 0);
      return;
    }

    const sel = options.find((o) => o.value === Number(productId));
    if (sel) {
      let price = 0;
      if (transactionType === "income") {
        price = sel.selling_price;
      } else if (transactionType === "expense") {
        console.log(sel.buying_price);
        console.log(sel.selling_price);

        price = sel.buying_price ?? sel.selling_price;
      } else if (transactionType === "share") {
        price = sel.selling_price;
      }
      console.log(price);

      setValue("amount", price * (qty || 1));
    } else {
      setValue("amount", 0);
    }
  }, [productId, qty, options, setValue, transactionType]);

  return (
    <div className="flex flex-col gap-4">
      <AnimatedDropdownSelect
        name="product_service_id"
        control={control}
        label="محصول یا خدمت"
        placeholder={loading ? "در حال بارگذاری..." : "انتخاب کنید..."}
        options={[
          { value: undefined, label: "پاک کردن انتخاب" }, // ✅ گزینه پاک کردن
          ...options.map((o) => ({ value: o.value, label: o.label })),
        ]}
        disabled={loading}
        onSearch={(term) => fetchOptions(term)}
      />

      {productId && productId !== "" && (
        <div>
          <label className="text-sm font-medium mb-1 block">تعداد</label>
          <Controller
            name="quantity"
            control={control}
            defaultValue={1}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                {...field}
                value={field.value ?? 1}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                className={cn(
                  "h-11 w-full px-3 rounded-lg border border-border/20 bg-box text-foreground flex items-center justify-between",
                  "focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                )}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
