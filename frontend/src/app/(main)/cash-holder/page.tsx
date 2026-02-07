"use client";

import { useState } from "react";
import DataTable from "@/components/main/DataTable";
import ConfirmModal from "@/components/main/ConfirmModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";
import { formatNumber } from "@/utils/formatters";

export default function Page() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { notify } = useNotification();
  const router = useRouter();

  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cash-holders/${selectedId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        notify("error", errData?.error || "خطا در حذف مشتری");
        return;
      }

      notify("success", "مشتری با موفقیت حذف شد ✅");

      // بعد از حذف دوباره دیتا رو بگیر
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      notify("error", "مشکلی پیش آمد");
    } finally {
      setShowModal(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="p-6">
      {/* سرچ تو Parent */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="جستجو..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // وقتی سرچ تغییر کرد، برگرد صفحه اول
          }}
          className="px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <DataTable<any>
        key={refreshKey} // 👈 باعث refetch میشه
        columns={[
          {
            header: "نام و نام خانوادگی",
            accessor: (row) => `${row.first_name} ${row.last_name}`,
          },
          { header: "شماره تلفن", accessor: "phone_number" },
          { header: "موجودی", accessor: (row) => formatNumber(row.amount) },
        ]}
        actions={[
          {
            label: "مشاهده",
            onClick: (row) => router.push(`/cash-holder/${row.id}`),
            className: "text-blue-500 cursor-pointer",
          },
          {
            label: "ویرایش",
            onClick: (row) => router.push(`/cash-holder/${row.id}?edit=true`),
            className: "cursor-pointer",
          },
          {
            label: "حذف",
            onClick: (row) => confirmDelete(row.id),
            className: "text-red-500 cursor-pointer",
          },
        ]}
        title="افزودن مشتری"
        href="/cash-holder/add"
        apiUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/cash-holders/`}
        page={page}
        search={search}
        onPageChange={setPage}
      />

      <ConfirmModal
        show={showModal}
        title="تایید حذف"
        message="آیا مطمئن هستید که می‌خواهید این مشتری را حذف کنید؟"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
