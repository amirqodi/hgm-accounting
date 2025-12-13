import { z } from "zod";

// Regex فارسی مشابه PersianRex
const persianTextRegex = /^[\u0600-\u06FF\s]+$/;
const persianTextWithNumbersAndPunctRegex =
  /^[\u0600-\u06FF0-9،؟«»؛٬.:!\-\[\]\()/\s]+$/;
const phoneNumberRegex = /^09\d{9}$/;

// ------------------ Customer ------------------
const sanitizePhone = z
  .string()
  .transform((val) => {
    // حذف کاراکترهای غیرعددی
    let cleaned = val.replace(/[^\d]/g, "");

    // اگر با 98 شروع شد -> تبدیل به 0
    if (cleaned.startsWith("98")) {
      cleaned = "0" + cleaned.slice(2);
    }

    return cleaned;
  })
  .refine((val) => /^09\d{9}$/.test(val), {
    message: "شماره تلفن باید با فرمت 09 و دقیقا 11 رقم باشد",
  });

// ------------------ Customer ------------------
export const customerSchema = z.object({
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
  phone_number: sanitizePhone,
  car_type: z.string().min(1, "نوع خودرو الزامی است"),
  car_kilometer: z.number().min(0, "کیلومتر ماشین باید عدد نامنفی باشد"),
  type: z.literal("customer"),
});

// ------------------ Vendor ------------------
export const vendorSchema = z.object({
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
  phone_number: sanitizePhone,
  address: z
    .string()
    .min(1, "آدرس الزامی است")
    .refine(
      (val) => persianTextWithNumbersAndPunctRegex.test(val),
      "آدرس باید فارسی باشد"
    ),
  type: z.literal("vendor"),
});

// ------------------ Shareholder ------------------
export const shareholderSchema = z.object({
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
  phone_number: sanitizePhone,
  share_percentage: z
    .number()
    .min(0.0001, "درصد سهام باید عدد مثبت باشد")
    .max(100, "درصد سهام باید کمتر یا مساوی 100 باشد"),
  type: z.literal("shareholder"),
});
