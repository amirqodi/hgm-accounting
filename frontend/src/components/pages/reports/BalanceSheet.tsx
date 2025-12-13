"use client";

import React from "react";

type BalanceSheetData = {
  assets: {
    bank_accounts: number;
    cash_holders: number;
    inventory: number;
    receivables: number;
    deposits_received: number;
    total: number;
  };
  liabilities: {
    deposits_paid: number;
    payables: number;
    total: number;
  };
  equity: {
    capital: number;
    retained_earnings: number;
    total: number;
  };
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
};

interface Props {
  data: BalanceSheetData;
}

export default function BalanceSheetPage({ data }: Props) {
  const formatNumber = (n: number) => n.toLocaleString("fa-IR") + " ريال";

  const card = (title: string, rows: { label: string; value: number }[]) => (
    <div className="bg-box shadow-lg rounded-xl p-6 w-full min-w-lg">
      <h2 className="text-2xl font-bold mb-4 text-right">{title}</h2>
      <table className="w-full text-lg text-foreground">
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={idx}
              className="border-b border-border/50 hover:bg-muted/10 transition"
            >
              <td className="px-4 py-3 text-right font-medium">{r.label}</td>
              <td className="px-4 py-3 text-left text-lg">
                {formatNumber(r.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const assetRows = [
    { label: "بانک‌ها", value: data.assets.bank_accounts },
    { label: "تنخواه گردان", value: data.assets.cash_holders },
    { label: "موجودی کالا", value: data.assets.inventory },
    { label: "دریافتنی‌ها", value: data.assets.receivables },
    { label: "ودیعه دریافتی", value: data.assets.deposits_received },
    { label: "جمع کل دارایی‌ها", value: data.assets.total },
  ];

  const liabilityRows = [
    { label: "ودیعه پرداختی", value: data.liabilities.deposits_paid },
    { label: "پرداختنی‌ها", value: data.liabilities.payables },
    { label: "جمع کل بدهی‌ها", value: data.liabilities.total },
  ];

  const equityRows = [
    { label: "سرمایه", value: data.equity.capital },
    { label: "سود و زیان", value: data.equity.retained_earnings },
    { label: "جمع کل سرمایه", value: data.equity.total },
  ];

  const totalRows = [
    { label: "جمع کل دارایی‌ها", value: data.total_assets },
    { label: "جمع کل بدهی‌ها", value: data.total_liabilities },
    { label: "جمع کل سرمایه", value: data.total_equity },
  ];

  return (
    <div className="max-w-8xl mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-extrabold mb-6 text-center">ترازنامه</h1>

      <div className="flex gap-6">
        {card("دارایی‌ها", assetRows)}

        <div className="flex flex-col gap-6">
          {card("بدهی‌ها", liabilityRows)}
          {card("سرمایه سهامداران", equityRows)}
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1">{card("جمع کل‌ها", totalRows)}</div>

        <div className="flex-1 flex items-center justify-center gap-6 bg-box shadow-lg rounded-xl p-4">
          <div className="flex flex-col items-center text-foreground border-2 border-foreground rounded-2xl px-6 py-4 shadow-lg text-lg bg-box">
            <span>دارایی‌ها</span>
            <span className="mt-2 font-bold">
              {formatNumber(data.total_equity + data.total_liabilities)}
            </span>
          </div>

          <span className="text-3xl font-extrabold text-foreground">=</span>

          <div className="flex flex-col items-center text-foreground border-2 border-foreground rounded-2xl px-6 py-4 shadow-lg text-lg bg-box">
            <span>حقوق صاحبان سهام</span>
            <span className="mt-2 font-bold">
              {formatNumber(data.total_equity)}
            </span>
          </div>

          <span className="text-3xl font-extrabold text-foreground">+</span>

          <div className="flex flex-col items-center text-foreground border-2 border-foreground rounded-2xl px-6 py-4 shadow-lg text-lg bg-box">
            <span>بدهی‌ها</span>
            <span className="mt-2 font-bold">
              {formatNumber(data.total_liabilities)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
