import React, { useEffect, useState } from "react";
import InfoCart from "@/components/main/InfoCart";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { FiDollarSign } from "react-icons/fi";
import { AiOutlineBank } from "react-icons/ai";
import Cookies from "js-cookie";

interface DashboardSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
}

interface TotalBalance {
  bank_balance: number;
  cash_holder_balance: number;
  total: number;
}

export default function DashboardCards() {
  const [infoCartData, setInfoCartData] = useState([
    {
      titel: "درآمد",
      Icon: FaArrowTrendUp,
      color: "bg-green-500",
      amount: "0",
    },
    {
      titel: "هزینه",
      Icon: FaArrowTrendDown,
      color: "bg-red-500",
      amount: "0",
    },
    {
      titel: "سود خالص",
      Icon: FiDollarSign,
      color: "bg-blue-500",
      amount: "0",
    },
    {
      titel: "موجودی کل",
      Icon: AiOutlineBank,
      color: "bg-yellow-500",
      amount: "0",
    },
  ]);

  useEffect(() => {
    const t = Cookies.get("auth_token") || "";

    if (!t) return;

    // گرفتن خلاصه درآمد و هزینه
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/summery`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => res.json())
      .then((data: DashboardSummary) => {
        const income = data.total_income;
        const expense = data.total_expense;
        const profit = data.net_profit;

        setInfoCartData((prev) => [
          {
            ...prev[0],
            amount: income.toLocaleString(),
          },
          {
            ...prev[1],
            amount: expense.toLocaleString(),
          },
          {
            ...prev[2],
            amount: profit.toLocaleString(),
          },
          prev[3], // موجودی کل را بعداً از API جداگانه می‌گیریم
        ]);
      });

    // گرفتن موجودی کل
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/total-balance`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => res.json())
      .then((data: TotalBalance) => {
        setInfoCartData((prev) => [
          prev[0],
          prev[1],
          prev[2],
          { ...prev[3], amount: data.total.toLocaleString() },
        ]);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {infoCartData.map((item) => (
        <InfoCart key={item.titel} {...item} />
      ))}
    </div>
  );
}
