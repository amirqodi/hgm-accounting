"use client";

import React, { useEffect, useState } from "react";
import { FaDollarSign, FaCoins } from "react-icons/fa";
import { GiGoldBar } from "react-icons/gi";
import Cookies from "js-cookie";

interface PricesData {
  dollar: number;
  tether: number;
  gold: number;
}

const Prices: React.FC = () => {
  const [prices, setPrices] = useState<PricesData>({
    dollar: 0,
    tether: 0,
    gold: 0,
  });

  useEffect(() => {
    const token = Cookies.get("auth_token");

    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/price`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch prices");
        const data = await res.json();
        setPrices({
          dollar: data.usd,
          tether: data.tether,
          gold: data.gold18,
        });
      } catch (error) {
        console.error(error);
        // اگر اینترنت نبود یا API خطا داد، می‌توانیم از مقادیر قبلی استفاده کنیم
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // هر ۱ دقیقه
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6 text-white">
      <div className="flex items-center gap-2">
        <FaDollarSign className="text-green-400" />
        دلار: {(prices.dollar * 10).toLocaleString("fa-IR")}{" "}
        <span className="text-xs">ريال</span>
      </div>
      <div className="flex items-center gap-2">
        <FaCoins className="text-yellow-400" />
        تتر: {(prices.tether * 10).toLocaleString("fa-IR")}{" "}
        <span className="text-xs">ريال</span>
      </div>
      <div className="flex items-center gap-2">
        <GiGoldBar className="text-orange-400" />
        طلا: {(prices.gold * 10).toLocaleString("fa-IR")}{" "}
        <span className="text-xs">ريال</span>
      </div>
    </div>
  );
};

export default Prices;
