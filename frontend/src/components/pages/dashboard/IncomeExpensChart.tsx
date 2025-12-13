"use client";

import { formatDate } from "@/utils/formatters";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Period = "daily" | "weekly" | "monthly";

type ApiReport = {
  period: string;
  income: number;
  expense: number;
  net_profit: number;
};

type ChartData = {
  name: string;
  income: number;
  expense: number;
};

interface Props {
  token: string; // توکن را از parent component دریافت می‌کنیم
}

const IncomeExpensChart: React.FC<Props> = ({ token }) => {
  const [period, setPeriod] = useState<Period>("monthly");
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reports/income-expense/?period=${period}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // 👈 اضافه کردن توکن
          }
        );
        if (!res.ok) throw new Error("Failed to fetch data");
        const apiData: ApiReport[] = await res.json();

        const chartData: ChartData[] = apiData.map((item) => ({
          name: formatPeriod(item.period, period),
          income: item.income,
          expense: item.expense,
        }));

        setData(chartData);
      } catch (err) {
        console.error("Error fetching income-expense data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData(); // فقط وقتی توکن موجود است فراخوانی شود
  }, [period, token]);

  const formatPeriod = (periodStr: string, periodType: Period) => {
    if (periodType === "daily") {
      return periodStr; // همون نام روز هفته ("شنبه" تا "جمعه")
    } else if (periodType === "weekly") {
      return periodStr; // چون بک‌اند خودش "هفته 1" و ... برمی‌گردونه
    } else {
      return periodStr; // ماه‌ها فارسی
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-green-500">
            درآمد: {payload[0].value.toLocaleString()} ريال
          </p>
          <p className="text-red-500">
            هزینه: {payload[1].value.toLocaleString()} ريال
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-box rounded-xl shadow-md p-4 w-full">
      <div className="flex items-center justify-start gap-6 mb-4">
        <h2 className="font-bold text-lg w-40">
          درآمد و هزینه{" "}
          {period === "monthly"
            ? "ماهانه"
            : period === "weekly"
            ? "هفتگی"
            : "روزانه"}
        </h2>
        <div className="flex gap-2 border rounded-3xl overflow-hidden">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-sm ${
                period === p ? "bg-background font-semibold" : "text-gray-500"
              }`}
            >
              {p === "daily" ? "روزانه" : p === "weekly" ? "هفتگی" : "ماهانه"}
            </button>
          ))}
        </div>
        <div className="mr-auto flex items-center gap-4">
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="bg-[#22c55e] rounded-full w-3 h-3"></span>
            <p>درآمد</p>
          </div>
          <div className="flex flex-col justify-center items-center gap-1">
            <span className="bg-[#ef4444] rounded-full w-3 h-3"></span>
            <p>هزینه</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              padding={{ left: 20, right: 20 }}
              tick={{ fontSize: 12 }}
              textAnchor="end"
              dy={10}
            />
            <Tooltip content={CustomTooltip} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 5, fill: "#22c55e" }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 5, fill: "#ef4444" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IncomeExpensChart;
