import moment from "moment-jalaali";

// فارسی‌سازی moment
moment.loadPersian({ usePersianDigits: true });

// مپ ترجمه نوع تراکنش
const transactionTypeMap: Record<string, string> = {
  income: "دریافت",
  expense: "پرداخت",
  share: "سهام",
};

// مپ ترجمه روش پرداخت
const paymentMethodMap: Record<string, string> = {
  cash: "نقدی",
  cheque: "چک",
  card: "کارت",
  installment: "اقساط",
};

// 📌 فرمت تاریخ (فقط روز-ماه-سال شمسی، بدون ساعت)
export function formatDate(date?: string | null): string {
  if (!date) return "-";
  return moment(date).format("jYYYY/jMM/jDD");
}

// 📌 فرمت مبلغ (۳ تا ۳ تا جدا + فارسی)
export function formatNumber(value: number) {
  if (!value && value !== 0) return "";
  return value.toLocaleString("en-US"); // یا "fa-IR" برای فارسی
}

// 📌 ترجمه نوع تراکنش
export function formatTransactionType(type: string): string {
  return transactionTypeMap[type] || type;
}

// 📌 ترجمه روش پرداخت
export function formatPaymentMethod(method: string): string {
  return paymentMethodMap[method] || method;
}
