"use client";

import { useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import TextInput from "@/components/forms/TextInput";
import Cookies from "js-cookie";
import TextArea from "./TextArea";
import {
  customerSchema,
  vendorSchema,
  shareholderSchema,
} from "@/types/contactSchema";
import { useNotification } from "../main/NotificationProvider";
import { useRouter } from "next/navigation";

// ---------------- Schema ----------------

const formSchema = z.discriminatedUnion("type", [
  customerSchema,
  vendorSchema,
  shareholderSchema,
]);

type FormValues = z.infer<typeof formSchema>;

// ---------------- Motion Variants ----------------
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function AnimatedWizardForm() {
  const [contactType, setContactType] = useState<
    "customer" | "vendor" | "shareholder"
  >("customer");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { notify } = useNotification();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      type: "customer",
    } as FormValues,
  });

  const sendData = async (data: FormValues) => {
    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(`${API_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        if (error) {
          Object.entries(error).forEach(([field, error]: any) => {
            form.setError(field as keyof FormValues, {
              type: "server",
              message: Array.isArray(error) ? error[0] : error,
            });
          });
        }

        notify("error", error?.error || "ارسال با خطا مواجه شد");
        return;
      }

      notify("success", "مخاطب با موفقیت ثبت شد");
      form.reset();

      // ✅ مسیر بعد از موفقیت
      const prev = document.referrer; // آدرس صفحه قبلی
      if (prev && prev.includes("/transactions/add")) {
        router.push("/transactions/add");
      } else {
        router.push(
          `/contacts/${data.type === "customer" ? "" : data.type + "s"}`
        ); // مثلا contacts/customer
      }
    } catch (err: any) {
      if (!form.formState.isSubmitting)
        notify("error", err.error || "مشکلی پیش آمد");
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Send all contact types to the same endpoint
    await sendData(data);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-md mx-auto p-8 bg-box rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-8 text-foreground">
        افزودن مخاطب
      </h2>

      {/* فیلدهای عمومی */}
      <TextInput
        label="نام"
        {...form.register("first_name")}
        error={form.formState.errors.first_name?.message}
      />
      <TextInput
        label="نام خانوادگی"
        {...form.register("last_name")}
        error={form.formState.errors.last_name?.message}
      />
      <TextInput
        label="شماره تلفن"
        {...form.register("phone_number")}
        error={form.formState.errors.phone_number?.message}
      />

      {/* انتخاب نوع مخاطب */}
      <div className="mb-6">
        <label className="mb-1 block font-medium text-gray-500">
          نوع مخاطب :
        </label>
        <select
          value={contactType}
          onChange={(e) => {
            setContactType(e.target.value as any);
            form.setValue("type", e.target.value as any);
          }}
          className="w-full border font-bold rounded-md px-3 py-2 bg-box focus:outline-none"
        >
          <option value="customer">مشتری</option>
          <option value="vendor">فروشنده</option>
          <option value="shareholder">سهامدار</option>
        </select>
      </div>

      {/* فیلدهای اختصاصی */}
      <AnimatePresence mode="wait">
        {contactType === "customer" && (
          <motion.div
            key="customer-fields"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TextInput
              label="نوع خودرو"
              {...form.register("car_type")}
              error={
                "car_type" in form.formState.errors
                  ? form.formState.errors.car_type?.message
                  : undefined
              }
            />
            <Controller
              name="car_kilometer"
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
                    label="کیلومتر"
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

        {contactType === "vendor" && (
          <motion.div
            key="vendor-fields"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TextArea
              label="آدرس"
              {...form.register("address")}
              error={
                "address" in form.formState.errors
                  ? form.formState.errors.address?.message
                  : undefined
              }
            />
          </motion.div>
        )}

        {contactType === "shareholder" && (
          <motion.div
            key="shareholder-fields"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TextInput
              label="درصد سهام"
              type="number"
              {...form.register("share_percentage", { valueAsNumber: true })}
              error={
                "share_percentage" in form.formState.errors
                  ? form.formState.errors.share_percentage?.message
                  : undefined
              }
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
