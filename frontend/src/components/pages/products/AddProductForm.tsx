"use client";

import { useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import TextInput from "@/components/forms/TextInput";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";

// ---------------- Schemas ----------------
const serviceSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "نام الزامی است"),
  selling_price: z.number().min(1, "قیمت فروش الزامی است"),
  type: z.literal("service"),
});

const productSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "نام الزامی است"),
  selling_price: z.number().min(1, "قیمت فروش الزامی است"),
  buying_price: z.number().min(1, "قیمت خرید الزامی است"),
  type: z.literal("product"),
});

const formSchema = z.discriminatedUnion("type", [serviceSchema, productSchema]);
type FormValues = z.infer<typeof formSchema>;

// ---------------- Motion Variants ----------------
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ---------------- Component ----------------
export default function ProductServiceForm() {
  const [itemType, setItemType] = useState<"service" | "product">("service");
  const { notify } = useNotification();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      selling_price: 0,
      buying_price: "",
      stock: 0,
      type: "service",
    } as FormValues,
  });

  const sendData = async (endpoint: string, data: FormValues) => {
    const { type, ...payload } = data;

    const numericPayload = {
      ...payload,
      selling_price: Number(payload.selling_price),
      ...(payload.hasOwnProperty("buying_price") && {
        buying_price:
          (payload as { buying_price?: string }).buying_price !== undefined
            ? Number((payload as { buying_price?: string }).buying_price)
            : undefined,
      }),
      ...(payload.hasOwnProperty("stock") && {
        stock:
          (payload as { stock?: number }).stock !== undefined
            ? Number((payload as { stock?: number }).stock)
            : undefined,
      }),
    };

    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(numericPayload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        let hasError = false;

        if (error) {
          Object.entries(error).forEach(([field, messages]: any) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;

            if (field === "error") {
              notify("error", msg); // خطای عمومی
            } else {
              form.setError(field as keyof FormValues, {
                type: "server",
                message: msg,
              });
            }

            hasError = true;
          });
        }

        if (hasError) return; // خطا داشتیم، از ادامه جلوگیری می‌کنیم
      }

      notify("success", "محصول/خدمت با موفقیت ثبت شد");
      form.reset();
    } catch (err: any) {
      notify("error", err.error || "مشکلی پیش آمد");
    }
  };

  const onSubmit = async (data: FormValues) => {
    await sendData("/api/products/", data);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="min-w-xl mx-auto p-8 bg-box rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-8 text-foreground">
        ثبت محصول / خدمت
      </h2>

      {/* انتخاب نوع */}
      <div className="mb-6">
        <label className="mb-1 block font-medium text-gray-500">نوع:</label>
        <select
          value={itemType}
          onChange={(e) => {
            setItemType(e.target.value as any);
            form.setValue("type", e.target.value as any);
          }}
          className="w-full border font-bold rounded-md px-3 py-2 bg-box focus:outline-none"
        >
          <option value="service">خدمت</option>
          <option value="product">محصول</option>
        </select>
      </div>

      {/* فیلدها */}
      <AnimatePresence mode="wait">
        {itemType === "service" && (
          <motion.div
            key="service-fields"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TextInput
              label="کد"
              {...form.register("code")}
              error={form.formState.errors.code?.message}
            />
            <TextInput
              label="نام"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />
            <Controller
              name="selling_price"
              control={form.control}
              render={({ field, fieldState }) => {
                const handleChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const numericValue = e.target.value.replace(/,/g, ""); // حذف کاما
                  field.onChange(
                    numericValue === "" ? undefined : Number(numericValue)
                  );
                };

                return (
                  <TextInput
                    label="قیمت فروش"
                    type="text" // type=text برای جداکننده هزارگان
                    value={
                      field.value !== undefined && field.value !== null
                        ? Number(field.value).toLocaleString("en-US")
                        : ""
                    }
                    onChange={handleChange}
                    error={fieldState.error?.message}
                    thousandSeparator
                    dir="ltr"
                  />
                );
              }}
            />
          </motion.div>
        )}

        {itemType === "product" && (
          <motion.div
            key="product-fields"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TextInput
              label="کد"
              {...form.register("code")}
              error={form.formState.errors.code?.message}
            />
            <TextInput
              label="نام"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
            />
            <Controller
              name="selling_price"
              control={form.control}
              render={({ field, fieldState }) => {
                const handleChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const numericValue = e.target.value.replace(/,/g, ""); // حذف کاما
                  field.onChange(
                    numericValue === "" ? undefined : Number(numericValue)
                  );
                };

                return (
                  <TextInput
                    label="قیمت فروش"
                    type="text" // type=text برای جداکننده هزارگان
                    value={
                      field.value !== undefined && field.value !== null
                        ? Number(field.value).toLocaleString("en-US")
                        : ""
                    }
                    onChange={handleChange}
                    error={fieldState.error?.message}
                    thousandSeparator
                    dir="ltr"
                  />
                );
              }}
            />

            <Controller
              name="buying_price"
              control={form.control}
              render={({ field, fieldState }) => {
                const handleChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const numericValue = e.target.value.replace(/,/g, ""); // حذف کاما
                  field.onChange(
                    numericValue === "" ? undefined : Number(numericValue)
                  );
                };

                return (
                  <TextInput
                    label="قیمت خرید"
                    type="text" // type=text برای جداکننده هزارگان
                    value={
                      field.value !== undefined && field.value !== null
                        ? Number(field.value).toLocaleString("en-US")
                        : ""
                    }
                    onChange={handleChange}
                    error={fieldState.error?.message}
                    thousandSeparator
                    dir="ltr"
                  />
                );
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        className="mt-6 w-full bg-primary text-white py-2 rounded-lg hover:brightness-125 transition"
      >
        ثبت
      </button>
    </form>
  );
}
