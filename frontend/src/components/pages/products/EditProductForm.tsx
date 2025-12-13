"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";

const productSchema = z.object({
  code: z.string().min(1, "کد الزامی است"),
  name: z.string().min(1, "نام الزامی است"),
  selling_price: z.string().min(1, "قیمت فروش الزامی است"),
  buying_price: z.string().min(1, "قیمت خرید الزامی است"),
  stock: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
});

type ProductForm = z.infer<typeof productSchema>;

// تابع برای فرمت ۳رقم ۳رقم
const formatNumber = (value: string | number) => {
  if (!value && value !== 0) return "";
  const num = String(value).replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// تابع برای حذف کاما قبل ارسال
const parseNumber = (value: string) => Number(value.replace(/,/g, ""));

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { notify } = useNotification();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      selling_price: "",
      buying_price: "",
      stock: 0,
    },
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(`${API_URL}/api/products/${id}/`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("خطا در دریافت اطلاعات محصول");
        const data = await res.json();
        // قیمت‌ها را فرمت ۳رقم ۳رقم کن
        form.reset({
          ...data,
          selling_price: formatNumber(data.selling_price),
          buying_price: formatNumber(data.buying_price),
        });
      } catch (err: any) {
        notify("error", err.message || "مشکلی پیش آمد");
      }
    };
    fetchProduct();
  }, [id, API_URL, form, notify]);

  const onSubmit = async (data: ProductForm) => {
    const payload = {
      ...data,
      selling_price: parseNumber(data.selling_price),
      buying_price: parseNumber(data.buying_price),
      stock: data.stock,
    };

    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(`${API_URL}/api/products/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        notify("error", error?.error || "ویرایش با خطا مواجه شد");
        return;
      }

      notify("success", "محصول با موفقیت ویرایش شد");
      router.push("/products");
    } catch (err: any) {
      notify("error", err.message || "مشکلی پیش آمد");
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="min-w-xl mx-auto p-8 bg-box rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-8 text-foreground">
        ویرایش محصول
      </h2>

      <div className="mb-4">
        <label className="block mb-1">کد</label>
        <input
          type="text"
          {...form.register("code")}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.code && (
          <p className="text-red-500 mt-1">
            {form.formState.errors.code.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1">نام</label>
        <input
          type="text"
          {...form.register("name")}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.name && (
          <p className="text-red-500 mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1">قیمت فروش</label>
        <input
          type="text"
          {...form.register("selling_price", {
            onChange: (e) => {
              e.target.value = formatNumber(e.target.value);
            },
          })}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.selling_price && (
          <p className="text-red-500 mt-1">
            {form.formState.errors.selling_price.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1">قیمت خرید</label>
        <input
          type="text"
          {...form.register("buying_price", {
            onChange: (e) => {
              e.target.value = formatNumber(e.target.value);
            },
          })}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.buying_price && (
          <p className="text-red-500 mt-1">
            {form.formState.errors.buying_price.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1">موجودی</label>
        <input
          type="number"
          {...form.register("stock", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.stock && (
          <p className="text-red-500 mt-1">
            {form.formState.errors.stock.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!form.formState.isDirty}
        className={`mt-6 w-full py-2 rounded-lg transition ${
          form.formState.isDirty
            ? "bg-primary text-white hover:brightness-125"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        ویرایش
      </button>
    </form>
  );
}
