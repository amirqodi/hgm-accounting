"use client";
import ConfirmModal from "@/components/main/ConfirmModal";
import DataTable from "@/components/main/DataTable";
import { useNotification } from "@/components/main/NotificationProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";

export default function ShareHolderPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0); // 👈 کلید برای رفرش
  const router = useRouter();
  const { notify } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const confirmDelete = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contacts/${selectedId}/`,
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
        notify("error", errData?.error || "خطا در حذف مخاطب");
        return;
      }
      notify("success", "مشتری با موفقیت حذف شد ✅");

      // 👇 بعد از حذف، refreshKey رو تغییر بده تا DataTable دوباره fetch کنه
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
      {/* سرچ توی Parent */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="جستجو..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <DataTable<any>
        key={refreshKey} // 👈 کلید باعث میشه ری‌راندر و fetch انجام بشه
        columns={[
          {
            header: "نام و نام خانوادگی",
            accessor: (row) => `${row.first_name} ${row.last_name}`,
          },
          { header: "شماره تلفن", accessor: "phone_number" },
          {
            header: "درصد سهم",
            accessor: "share_percentage",
            formatNumber: true,
          },
          { header: "مقدار سرمایه", accessor: "amount", formatNumber: true },
        ]}
        actions={[
          {
            label: "مشاهده",
            onClick: (row) => router.push(`/contacts/shareholders/${row.id}`),
            className: "text-blue-500 cursor-pointer",
          },
          {
            label: "ویرایش",
            onClick: (row) =>
              router.push(`/contacts/shareholders/${row.id}?edit=true`),
            className: "cursor-pointer",
          },
          {
            label: "حذف",
            onClick: (row) => confirmDelete(row.id),
            className: "text-red-500 cursor-pointer",
          },
        ]}
        title="افزودن سهامدار"
        href="/contacts/add"
        apiUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/contacts/?type=shareholder&`}
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
