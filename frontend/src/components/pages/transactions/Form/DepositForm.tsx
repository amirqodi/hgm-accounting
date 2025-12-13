"use client";

import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";
import ContactField from "./ContactField";
import FormDatePicker from "../ui/FormDatePicker";
import NumberInput from "../ui/FormNumberInput";
import AnimatedDropdownSelect from "../ui/FormSelect";
import MoneySourceField from "./MoneySourceField";
import moment from "moment-jalaali";

moment.loadPersian({ usePersianDigits: true }); // فعال کردن شمسی

const schema = z.object({
  contact_id: z.number().min(1, "انتخاب مخاطب الزامی است"),
  money_source_type: z.enum(["bank", "cash"]),
  money_source_id: z.number().min(1, "انتخاب حساب الزامی است"),
  type: z.enum(["received", "paid"]),
  amount: z.number().min(1, "مبلغ باید بیشتر از صفر باشد"),
  deposit_date: z.string().min(1, "تاریخ الزامی است"),
  notes: z.string().optional(),
});

type DepositFormValues = z.infer<typeof schema>;

export default function DepositForm() {
  const { notify } = useNotification();

  const methods = useForm<DepositFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      money_source_type: "bank",
      type: "received",
      amount: 0,
      deposit_date: "",
      notes: "",
    },
  });

  const onSubmit = async (data: DepositFormValues) => {
    const token = Cookies.get("auth_token");

    // تبدیل تاریخ جلالی به میلادی
    const depositDateGregorian = moment(
      data.deposit_date,
      "jYYYY/jMM/jDD"
    ).format("YYYY-MM-DD");

    // ارسال JSON به جای FormData تا مطمئن باشیم اعداد درست هستند
    const payload: Record<string, any> = {
      contact_id: data.contact_id,
      money_source_type: data.money_source_type,
      type: data.type,
      amount: data.amount,
      notes: data.notes || "",
      deposit_date: depositDateGregorian,
    };
    if (data.money_source_type === "bank") {
      payload.bank_account_id = data.money_source_id;
    } else {
      payload.cash_holder_id = data.money_source_id;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        notify("error", err.error || "ثبت ودیعه موفق نبود!");
      } else {
        notify("success", "ودیعه با موفقیت ثبت شد!");
        methods.reset();
      }
    } catch (err) {
      notify("error", "خطای شبکه! دوباره تلاش کنید.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6 p-6 bg-box rounded-xl shadow"
      >
        <div className="space-y-4 border border-border/20 rounded-xl p-6 flex flex-col justify-center items-center">
          <MoneySourceField />
          <ContactField />
        </div>
        <div className="space-y-4 border border-border/20 rounded-xl gap-3 p-6 flex justify-center">
          <AnimatedDropdownSelect
            name="type"
            control={methods.control}
            label="نوع ودیعه"
            options={[
              { value: "received", label: "دریافتی" },
              { value: "paid", label: "پرداختی" },
            ]}
          />
          <NumberInput name="amount" control={methods.control} label="مبلغ" />
        </div>
        <div className="space-y-4 border border-border/20 rounded-xl gap-3 p-6 flex justify-start w-1/2">
          <FormDatePicker
            name="deposit_date"
            label="تاریخ"
            placeholder="تاریخ ودیعه"
          />
        </div>
        <Controller
          name="notes"
          control={methods.control}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="یادداشت..."
              className="w-full border rounded p-2"
            />
          )}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-white"
        >
          ثبت ودیعه
        </button>
      </form>
    </FormProvider>
  );
}
