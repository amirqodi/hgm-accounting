"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import Cookies from "js-cookie";

type Column<T> = {
  header: string;
  accessor: keyof T | string | ((row: T) => React.ReactNode);
  className?: string;
  formatNumber?: boolean;
};

type Action<T> = {
  label: string;
  onClick: (row: T) => void;
  className?: string;
  icon?: React.ReactNode;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  title: string;
  href: string;
  actions?: Action<T>[];
  page: number;
  rowsPerPage?: number;
  apiUrl: string;
  onPageChange?: (page: number) => void;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export default function DataTable<T extends { [key: string]: any }>({
  columns,
  title,
  href,
  actions,
  page,
  rowsPerPage = 10,
  apiUrl,
  onPageChange,
  search,
  startDate,
  endDate,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // 🔹 Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 🔹 Fetch data whenever page, debouncedSearch, startDate, endDate تغییر کنه
  useEffect(() => {
    const token = Cookies.get("auth_token");
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = new URL(apiUrl);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("page_size", rowsPerPage.toString());
        if (debouncedSearch) url.searchParams.append("search", debouncedSearch);
        if (startDate) url.searchParams.append("start_date", startDate);
        if (endDate) url.searchParams.append("end_date", endDate);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("خطا در دریافت داده‌ها");

        const json = await res.json();
        setData(json.results || json.data || json || []);
        setTotalPages(
          json.totalPages || Math.ceil((json.total || 0) / rowsPerPage)
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, debouncedSearch, startDate, endDate, apiUrl, rowsPerPage]);

  function getValue(row: T, accessor: Column<T>["accessor"]) {
    if (typeof accessor === "function") return accessor(row);
    if (typeof accessor === "string") {
      return accessor
        .split(".")
        .reduce((acc: any, key) => acc?.[key], row as any);
    }
    return row[accessor as keyof T];
  }

  return (
    <div className="w-full rounded-2xl shadow-md p-4">
      <div className="flex justify-end mb-4">
        <Link
          href={href}
          className="bg-primary p-2 px-4 rounded-md flex items-center gap-2 text-white hover:bg-secondary transition"
        >
          {title} <span className="text-2xl">+</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center p-4">در حال بارگذاری...</div>
      ) : (
        <table className="w-full border-collapse text-sm rounded-t-2xl overflow-hidden">
          <thead>
            <tr className="bg-box">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`p-2 text-center text-lg ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="p-2 text-xl text-center">عملیات</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="h-12 border-b border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-200 dark:hover:bg-muted transition"
              >
                {columns.map((col, j) => (
                  <td
                    key={j}
                    className={`p-2 text-center ${col.className || ""}`}
                  >
                    {getValue(row, col.accessor)}
                  </td>
                ))}

                {actions && (
                  <td className="p-2 text-center flex justify-center gap-2">
                    {actions.map((action, k) => (
                      <button
                        key={k}
                        onClick={() => action.onClick(row)}
                        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-muted transition ${action.className}`}
                        title={action.label}
                      >
                        {action.label === "حذف" && (
                          <Trash2 className="w-5 h-5 text-red-500" />
                        )}
                        {action.label === "ویرایش" && (
                          <Pencil className="w-5 h-5 text-blue-500" />
                        )}
                        {action.label === "مشاهده" && "مشاهده"}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}

            {/* 🔹 پر کردن ردیف‌های خالی تا ۱۰ ردیف */}
            {Array.from({ length: Math.max(0, 10 - data.length) }).map(
              (_, i) => (
                <tr
                  key={`empty-${i}`}
                  className="h-12 border-b border-gray-300 dark:border-gray-700"
                >
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="p-2"
                  ></td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => onPageChange?.(page - 1)}
          className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
        >
          قبلی
        </button>
        <span>
          {page} از {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPageChange?.(page + 1)}
          className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
        >
          بعدی
        </button>
      </div>
    </div>
  );
}
