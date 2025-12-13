"use client";

import React, { useEffect, useState } from "react";
import InfoCart from "@/components/main/InfoCart";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { FiDollarSign } from "react-icons/fi";
import { AiOutlineBank } from "react-icons/ai";
import LatestTransactions from "@/components/pages/dashboard/LatestTransactions";
import IncomeExpensChart from "@/components/pages/dashboard/IncomeExpensChart";
import Cookies from "js-cookie";
import DashboardCards from "@/components/pages/dashboard/DashboardCards";

export default function Home() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const t = Cookies.get("auth_token") || "";
    setToken(t);
  }, []);

  return (
    <>
      <main className="w-full flex-1">
        <section className="w-full p-8 flex flex-col gap-y-10">
          {/* Info Cards */}
          <DashboardCards />

          {/* نمودار درآمد و هزینه */}
          <div className="w-full flex justify-between gap-8">
            {token && <LatestTransactions token={token} />}
            {token && <IncomeExpensChart token={token} />}
          </div>
        </section>
      </main>
    </>
  );
}
