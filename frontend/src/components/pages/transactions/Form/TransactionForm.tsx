"use client";

import { useState } from "react";
import {
  useForm,
  FormProvider,
  Controller,
  useFieldArray,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AttachmentsField from "./AttachmentsField";
import MoneySourceField from "./MoneySourceField";
import ContactField from "./ContactField";
import CategoryField from "./CategoryField";
import ProductServiceField from "./ProductServiceField";
import FormDatePicker from "../ui/FormDatePicker";
import AnimatedDropdownSelect from "../ui/FormSelect";
import NumberInput from "../ui/FormNumberInput";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import { convertToISODate } from "@/lib/utils";
import SubTransactionsSection from "./Subtransaction";

const schema = z
  .object({
    money_source_type: z.enum(["cash", "bank"]),
    money_source_id: z.number(),
    contact_id: z.number(),
    category_id: z.number(),
    product_service_id: z.number().optional(),
    quantity: z.number().optional(),
    amount: z.number().min(1, "مبلغ باید بیشتر از صفر باشد"),
    payment_method: z.enum(["cash", "cheque", "card", "installment"]),
    transaction_type: z.enum(["income", "expense", "share"]),
    transaction_date: z.string().min(1),
    attachments: z.array(z.any()).optional(),
    notes: z.string().optional(),
    is_paid: z.boolean(),
    sub_transactions: z
      .array(
        z.object({
          amount: z.number().min(1, "مبلغ باید بیشتر از صفر باشد"),
          due_date: z.string().optional(),
          is_paid: z.boolean(), // بدون default
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sub_transactions && data.sub_transactions.length > 0) {
      const totalSubs = data.sub_transactions.reduce(
        (sum, sub) => sum + (sub.amount || 0),
        0
      );
      if (totalSubs !== data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "مجموع اقساط باید برابر مبلغ کل باشد",
          path: ["sub_transactions"], // 🔑 خطا روی کل آرایه بیفته
        });
      }
    }
  });

type TransactionFormValues = z.infer<typeof schema>;

export default function TransactionForm() {
  const { notify, refreshNotifications } = useNotification();

  const methods = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      money_source_type: "cash",
      payment_method: "cash",
      transaction_type: "expense",
      quantity: 1,
      amount: 0,
      transaction_date: "",
      notes: "",
      sub_transactions: [],
      is_paid: false,
    },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    console.log("transaction_date raw:", data.transaction_date);
    console.log(
      "transaction_date ISO:",
      convertToISODate(data.transaction_date)
    );

    const token = Cookies.get("auth_token");

    const money_source_type = data.payment_method === "cash" ? "cash" : "bank";

    const formData = new FormData();

    // Basic fields
    formData.append("money_source_type", money_source_type);
    formData.append(
      "bank_account_id",
      money_source_type === "bank" ? String(data.money_source_id) : ""
    );
    formData.append(
      "cash_holder_id",
      money_source_type === "cash" ? String(data.money_source_id) : ""
    );
    formData.append("contact_id", String(data.contact_id));
    formData.append("category_id", String(data.category_id));
    if (data.product_service_id) {
      formData.append("product_service_id", String(data.product_service_id));
    }
    if (data.quantity) {
      formData.append("quantity", String(data.quantity));
    }
    formData.append("amount", String(data.amount));
    formData.append("payment_method", data.payment_method);
    formData.append("transaction_type", data.transaction_type);
    if (data.notes) {
      formData.append("notes", data.notes);
    }

    // تاریخ‌ها
    const isoTransactionDate = convertToISODate(data.transaction_date);
    if (!isoTransactionDate) {
      notify("error", "تاریخ تراکنش معتبر نیست");
      return;
    }
    formData.append("transaction_date", isoTransactionDate);

    // ساب‌تراکنش‌ها
    if (data.sub_transactions && data.sub_transactions.length > 0) {
      formData.append(
        "sub_transactions",
        JSON.stringify(
          data.sub_transactions.map((sub) => ({
            amount: sub.amount,
            due_date: sub.due_date ? convertToISODate(sub.due_date) : null,
            is_paid: false,
          }))
        )
      );
    }

    const isPaidValue =
      !data.sub_transactions || data.sub_transactions.length === 0
        ? true // بدون ساب‌تراکنش، تراکنش پرداخت‌شده پیش‌فرض
        : data.is_paid;

    formData.append("is_paid", String(isPaidValue));

    // فایل‌ها
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append("attachments", file, file.name);
      });
    }

    for (const [k, v] of formData.entries()) {
      console.log(k, v);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ Do NOT set Content-Type; browser will set multipart/form-data automatically
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        notify(
          "error",
          errorData.error ||
            "ثبت تراکنش موفق نبود! لطفاً داده‌ها را بررسی کنید."
        );
      } else {
        const result = await res.json();
        console.log("✅ تراکنش ثبت شد:", result);
        notify("success", "تراکنش با موفقیت ثبت شد!");
        refreshNotifications();
        // methods.reset();
      }
    } catch (err) {
      console.error("خطای شبکه:", err);
      notify("error", "خطای شبکه! دوباره تلاش کنید.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto bg-box shadow-lg rounded-2xl p-8 space-y-8"
      >
        {/* اطلاعات پایه */}
        <div className="space-y-4 border border-border/20 rounded-xl p-6 flex flex-col justify-center items-center">
          <h3 className="font-semibold text-xl w-full text-right">
            اطلاعات پایه
          </h3>
          <MoneySourceField />
          <ContactField />
          <div className="grid md:grid-cols-2 gap-6 w-2xl">
            <CategoryField name="category_id" label="دسته بندی" />
            <ProductServiceField />
          </div>
        </div>

        {/* جزئیات تراکنش */}
        <div className="space-y-4 border border-border/20 rounded-xl p-6">
          <h3 className="font-semibold text-base">جزئیات تراکنش</h3>

          <div className="grid md:grid-cols-2 gap-6 w-2xl">
            <AnimatedDropdownSelect
              name="transaction_type"
              control={methods.control}
              label="نوع تراکنش"
              placeholder="نوع تراکنش"
              options={[
                { value: "income", label: "درآمد" },
                { value: "expense", label: "هزینه" },
                { value: "share", label: "سهام" },
              ]}
            />
            <NumberInput
              name="amount"
              control={methods.control}
              placeholder="0 ريال"
              label="مبلغ"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-2xl">
            <FormDatePicker
              name="transaction_date"
              label="تاریخ تراکنش"
              placeholder="تاریخ تراکنش"
            />
          </div>

          {/* ساب‌تراکنش‌ها */}

          <SubTransactionsSection
            control={methods.control}
            errors={methods.formState.errors}
          />

          <AttachmentsField label="پیوست فایل" />

          <div>
            <label className="text-sm font-medium mb-1 block">یادداشت‌ها</label>
            <Controller
              name="notes"
              control={methods.control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  placeholder="یادداشت مربوط به این تراکنش را بنویسید..."
                  className="w-full px-3 py-2 rounded-lg border border-border/20 bg-box text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              )}
            />
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-muted/10 text-muted hover:bg-muted/20"
          >
            انصراف
          </button>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-accent disabled:opacity-50"
            >
              ثبت تراکنش
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
