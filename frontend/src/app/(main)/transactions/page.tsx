"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/main/DataTable";
import ConfirmModal from "@/components/main/ConfirmModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";
import {
  formatDate,
  formatNumber,
  formatPaymentMethod,
  formatTransactionType,
} from "@/utils/formatters";
import { parseJalaliToGregorian } from "@/components/forms/TransactionFormDatePicker";
import TransactionsFilter from "@/components/forms/TransactionsFilter";

type Transaction = {
  id: number;
  contact: { id: number; first_name: string; last_name: string };
  category: { id: number; name: string };
  transaction_type: "income" | "expense";
  amount: number;
  payment_method: string;
  transaction_date: string;
  is_paid: boolean;
};

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { notify } = useNotification();
  const router = useRouter();

  const fetchTransactions = async (page: number, search: string) => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`
      );
      url.searchParams.append("page", page.toString());
      url.searchParams.append("page_size", "10");
      if (search) url.searchParams.append("search", search);
      if (startDate)
        url.searchParams.append(
          "start_date",
          parseJalaliToGregorian(startDate).toISOString()
        );
      if (endDate)
        url.searchParams.append(
          "end_date",
          parseJalaliToGregorian(endDate).toISOString()
        );

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        notify("error", "خطا در دریافت تراکنش‌ها");
        return;
      }
    } catch (err: any) {
      notify("error", err.message || "خطا در دریافت تراکنش‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page, search);
  }, [page]);

  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };
  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${selectedId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        notify("error", errData?.error || "خطا در حذف تراکنش");
        return;
      }
      notify("success", "تراکنش با موفقیت حذف شد ✅");
      setRefreshKey((k) => k + 1);
    } catch {
      notify("error", "مشکلی پیش آمد");
    } finally {
      setShowModal(false);
      setSelectedId(null);
    }
  };

  if (loading) return <p>در حال بارگذاری...</p>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">لیست تراکنش‌ها</h1>

      <TransactionsFilter
        search={search}
        setSearch={setSearch}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <DataTable<Transaction>
        columns={[
          { header: "شناسه", accessor: "id" },
          {
            header: "طرف حساب",
            accessor: (row) =>
              `${row.contact.first_name} ${row.contact.last_name}`,
          },
          { header: "دسته‌بندی", accessor: "category.name" },
          {
            header: "نوع",
            accessor: (row) => formatTransactionType(row.transaction_type),
          },
          { header: "مبلغ", accessor: (row) => formatNumber(row.amount) },
          {
            header: "روش پرداخت",
            accessor: (row) => formatPaymentMethod(row.payment_method),
          },
          {
            header: "تاریخ",
            accessor: (row) => formatDate(row.transaction_date),
          },
          {
            header: "وضعیت پرداخت",
            accessor: (row) => (
              <span
                className={`px-2 py-1 rounded-full text-white text-sm ${
                  row.is_paid ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {row.is_paid ? "پرداخت شده" : "پرداخت نشده"}
              </span>
            ),
          },
        ]}
        title="افزودن تراکنش"
        href="/transactions/add"
        page={page}
        onPageChange={setPage}
        apiUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/`}
        search={search}
        startDate={startDate}
        endDate={endDate}
        actions={[
          {
            label: "مشاهده",
            onClick: (row) => router.push(`/transactions/${row.id}`),
            className: "text-blue-500 cursor-pointer",
          },
          {
            label: "ویرایش",
            onClick: (row) => router.push(`/transactions/${row.id}?edit=true`),
            className: "cursor-pointer",
          },
          {
            label: "حذف",
            onClick: (row) => confirmDelete(row.id),
            className: "text-red-500 cursor-pointer",
          },
        ]}
        rowsPerPage={10}
        key={refreshKey}
      />

      <ConfirmModal
        show={showModal}
        title="تایید حذف"
        message="آیا مطمئن هستید که می‌خواهید این تراکنش را حذف کنید؟"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
