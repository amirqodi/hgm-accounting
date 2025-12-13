"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/main/DataTable";
import ConfirmModal from "@/components/main/ConfirmModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";
import { formatDate, formatNumber } from "@/utils/formatters";
import { parseJalaliToGregorian } from "@/components/forms/TransactionFormDatePicker";
import TransactionsFilter from "@/components/forms/TransactionsFilter";

type Deposit = {
  id: number;
  contact: { id: number; first_name: string; last_name: string };
  money_source_type: "cash" | "bank";
  type: "received" | "paid";
  amount: number;
  notes: string;
  created_at: string;
};

export default function DepositsPage() {
  const [data, setData] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { notify } = useNotification();
  const router = useRouter();

  const fetchDeposits = async (page: number, search: string) => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/deposits/`);
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
        notify("error", "خطا در دریافت ودیعه‌ها");
        return;
      }

      const json = await res.json();
      setData(json.results || json);
    } catch (err: any) {
      notify("error", err.message || "خطا در دریافت ودیعه‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(page, search);
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/deposits/${selectedId}/`,
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
        notify("error", errData?.error || "خطا در حذف ودیعه");
        return;
      }
      setData((prev) => prev.filter((item) => item.id !== selectedId));
      notify("success", "ودیعه با موفقیت حذف شد ✅");
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
      <h1 className="text-3xl font-bold mb-4">لیست ودیعه‌ها</h1>

      <TransactionsFilter
        search={search}
        setSearch={setSearch}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <DataTable<Deposit>
        columns={[
          { header: "شناسه", accessor: "id" },
          {
            header: "طرف حساب",
            accessor: (row) =>
              `${row.contact.first_name} ${row.contact.last_name}`,
          },
          {
            header: "نوع ودیعه",
            accessor: (row) =>
              row.type === "received" ? "دریافتی" : "پرداختی",
          },
          { header: "مبلغ", accessor: (row) => formatNumber(row.amount) },
          {
            header: "منبع پول",
            accessor: (row) =>
              row.money_source_type === "cash" ? "تنخواه" : "بانک",
          },
          { header: "توضیحات", accessor: "notes" },
          {
            header: "تاریخ",
            accessor: (row) => formatDate(row.created_at),
          },
        ]}
        title="افزودن ودیعه"
        href="/deposits/add"
        page={page}
        onPageChange={setPage}
        apiUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/deposits/`}
        search={search}
        startDate={startDate}
        endDate={endDate}
        actions={[
          {
            label: "مشاهده",
            onClick: (row) => router.push(`/deposit/${row.id}`),
            className: "text-blue-500 cursor-pointer",
          },
          {
            label: "ویرایش",
            onClick: (row) => router.push(`/deposit/${row.id}?edit=true`),
            className: "cursor-pointer",
          },
          {
            label: "حذف",
            onClick: (row) => confirmDelete(row.id),
            className: "text-red-500 cursor-pointer",
          },
        ]}
        rowsPerPage={10}
      />

      <ConfirmModal
        show={showModal}
        title="تایید حذف"
        message="آیا مطمئن هستید که می‌خواهید این ودیعه را حذف کنید؟"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
