"use client";

import { useState } from "react";
import DataTable from "@/components/main/DataTable";
import ConfirmModal from "@/components/main/ConfirmModal";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";

type Service = {
  id: number;
  code: string;
  name: string;
  selling_price: number;
};

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const router = useRouter();
  const { notify } = useNotification();

  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${selectedId}/`,
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
        notify("error", errData?.error || "خطا در حذف خدمت");
        return;
      }

      notify("success", "خدمت با موفقیت حذف شد ✅");
      setSelectedId(null);
      setShowModal(false);
    } catch (err) {
      notify("error", "مشکلی پیش آمد");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">لیست خدمات</h1>

      {/* سرچ */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="جستجو..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // وقتی سرچ تغییر کرد صفحه اول شود
          }}
          className="px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <DataTable<Service>
        columns={[
          { header: "کد خدمت", accessor: "code" },
          { header: "نام", accessor: "name" },
          {
            header: "قیمت فروش",
            accessor: "selling_price",
            formatNumber: true,
          },
        ]}
        actions={[
          {
            label: "مشاهده",
            onClick: (row) => router.push(`/services/${row.id}`),
            className: "text-blue-500 cursor-pointer",
          },
          {
            label: "ویرایش",
            onClick: (row) => router.push(`/services/${row.id}?edit=true`),
            className: "cursor-pointer",
          },
          {
            label: "حذف",
            onClick: (row) => confirmDelete(row.id),
            className: "text-red-500 cursor-pointer",
          },
        ]}
        title="افزودن خدمت"
        href="/services/add"
        apiUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/products/services/`} // آدرس API با pagination و search
        page={page}
        search={search}
        onPageChange={setPage}
        rowsPerPage={10}
      />

      <ConfirmModal
        show={showModal}
        title="تایید حذف"
        message="آیا مطمئن هستید که این خدمت را حذف کنید؟"
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
