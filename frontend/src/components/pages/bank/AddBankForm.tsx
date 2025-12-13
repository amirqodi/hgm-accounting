"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import BankSelector from "./BankGridSelector";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";

// Zod schema for BankAccount validation (front only – simple checks)
const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "لطفا بانک را انتخاب کنید"),
  account_number: z
    .string()
    .min(5, "شماره حساب معتبر نیست")
    .max(32, "شماره حساب نمی‌تواند بیشتر از 32 کاراکتر باشد"),
  card_number: z.string().length(16, "شماره کارت باید 16 رقم باشد"),
  iban: z.string().length(26, "شماره شبا باید 26 رقم باشد"), // شامل IR
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// --- Helper formatters ---
const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "") // فقط رقم
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1-");

const rawCardNumber = (value: string) => value.replace(/-/g, "");

const formatIban = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 24);
  return "IR" + digits;
};

const rawIban = (value: string) => value.toUpperCase().replace(/\s+/g, "");

export default function BankAccountForm({
  defaultValues,
}: {
  defaultValues?: Partial<BankAccountFormValues>;
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: defaultValues || {
      bank_name: "",
      card_number: "",
      account_number: "",
      iban: "",
    },
  });

  const cardNumber = useWatch({ control, name: "card_number" });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { notify } = useNotification();

  const onSubmit = async (data: BankAccountFormValues) => {
    const cleaned = {
      ...data,
      card_number: rawCardNumber(data.card_number),
      iban: rawIban(data.iban),
      account_number: data.account_number.replace(/\D/g, ""), // فقط ارقام
      balance: 0,
    };

    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(`${API_URL}/api/bank-accounts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
        body: JSON.stringify(cleaned),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        // Backend validation errors
        if (error) {
          Object.entries(error).forEach(([field, messages]: any) => {
            setError(field as keyof BankAccountFormValues, {
              type: "server",
              message: Array.isArray(messages) ? messages[0] : messages,
            });
          });
        }

        notify("error", error?.error || "ارسال با خطا مواجه شد");
      }

      const result = await res.json();
      if (result) {
        notify("success", "بانک با موفقیت ثبت شد");
      }
    } catch (err: any) {
      notify("error", err);
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
      {/* Bank Selector */}
      <div>
        <label className="block mb-1 font-medium text-muted">بانک</label>
        <Controller
          name="bank_name"
          control={control}
          render={({ field }) => (
            <BankSelector
              value={field.value ?? ""}
              onChange={field.onChange}
              cardNumber={cardNumber}
            />
          )}
        />
        {errors.bank_name && (
          <p className="text-destructive text-sm mt-1">
            {errors.bank_name.message}
          </p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label className="block mb-1 font-medium text-muted">شماره کارت</label>
        <Controller
          name="card_number"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={formatCardNumber(field.value ?? "")}
              onChange={(e) => field.onChange(rawCardNumber(e.target.value))}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="w-full p-2 border rounded-lg h-12 flex items-center"
              dir="ltr"
            />
          )}
        />
        {errors.card_number && (
          <p className="text-destructive text-sm mt-1">
            {errors.card_number.message}
          </p>
        )}
      </div>

      {/* Account Number */}
      <div>
        <label className="block mb-1 font-medium text-muted">شماره حساب</label>
        <Controller
          name="account_number"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={field.value ?? ""}
              onChange={
                (e) => field.onChange(e.target.value.replace(/\D/g, "")) // فقط عدد
              }
              placeholder="xxxxxxxxxx"
              className="w-full p-2 border rounded-lg h-12"
              dir="ltr"
            />
          )}
        />
        {errors.account_number && (
          <p className="text-destructive text-sm mt-1">
            {errors.account_number.message}
          </p>
        )}
      </div>

      {/* IBAN */}
      <div>
        <label className="block mb-1 font-medium text-muted">شماره شبا</label>
        <Controller
          name="iban"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              value={formatIban(field.value ?? "")}
              onChange={(e) => field.onChange(formatIban(e.target.value))}
              placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full p-2 border rounded-lg h-12"
              dir="ltr"
            />
          )}
        />
        {errors.iban && (
          <p className="text-destructive text-sm mt-1">{errors.iban.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full p-2 bg-primary text-white rounded-lg hover:bg-accent transition"
      >
        ذخیره
      </button>
    </motion.form>
  );
}
