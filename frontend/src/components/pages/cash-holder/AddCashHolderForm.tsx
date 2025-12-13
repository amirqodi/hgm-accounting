"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";

const persianTextRegex = /^[\u0600-\u06FF\s]+$/;
const phoneNumberRegex = /^09\d{9}$/;

// Schema با Zod
const userSchema = z.object({
  first_name: z
    .string()
    .min(1, "نام الزامی است")
    .refine((val) => persianTextRegex.test(val), "نام باید فارسی باشد"),
  last_name: z
    .string()
    .min(1, "نام خانوادگی الزامی است")
    .refine(
      (val) => persianTextRegex.test(val),
      "نام خانوادگی باید فارسی باشد"
    ),
  phone_number: z
    .string()
    .length(11, "شماره تلفن باید 11 رقم باشد")
    .refine(
      (val) => phoneNumberRegex.test(val),
      "شماره تلفن باید با فرمت 09 باشد"
    ),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserForm({
  defaultValues,
}: {
  defaultValues?: Partial<UserFormValues>;
}) {
  const { notify } = useNotification();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: defaultValues || {
      first_name: "",
      last_name: "",
      phone_number: "",
    },
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const onSubmit = async (data: UserFormValues) => {
    try {
      const token = Cookies.get("auth_token");
      const fullData = {
        ...data,
        balance: 0,
      };

      const res = await fetch(`${API_URL}/api/cash-holders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(fullData),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        // Backend validation errors
        if (error) {
          Object.entries(error).forEach(([field, messages]: any) => {
            setError(field as keyof UserFormValues, {
              type: "server",
              message: Array.isArray(messages) ? messages[0] : messages,
            });
          });
        }

        notify("error", error?.detail || "ارسال با خطا مواجه شد");
      }

      const result = await res.json();
      if (result) {
        notify("success", "تنخواه با موفقیت ایجاد شد");
      }
    } catch (err: any) {
      notify("error", err.message || "مشکلی پیش آمد");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-4 bg-box min-w-lg rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* First Name */}
      <div>
        <label className="block mb-1 font-medium text-muted">نام</label>
        <Controller
          name="first_name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="نام"
              className="w-full p-2 border rounded-lg h-12"
            />
          )}
        />
        {errors.first_name && (
          <p className="text-destructive text-sm mt-1">
            {errors.first_name.message}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label className="block mb-1 font-medium text-muted">
          نام خانوادگی
        </label>
        <Controller
          name="last_name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="نام خانوادگی"
              className="w-full p-2 border rounded-lg h-12"
            />
          )}
        />
        {errors.last_name && (
          <p className="text-destructive text-sm mt-1">
            {errors.last_name.message}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block mb-1 font-medium text-muted">شماره تلفن</label>
        <Controller
          name="phone_number"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="0912xxxxxxx"
              className="w-full p-2 border rounded-lg h-12"
              dir="ltr"
            />
          )}
        />
        {errors.phone_number && (
          <p className="text-destructive text-sm mt-1">
            {errors.phone_number.message}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="flex-1 p-2 bg-primary text-white rounded-lg hover:bg-accent transition"
        >
          ذخیره
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex-1 p-2 border rounded-lg hover:bg-gray-100 transition"
        >
          لغو
        </button>
      </div>
    </motion.form>
  );
}
