"use client";

import React from "react";
import TransactionFormDatePicker from "./TransactionFormDatePicker";

interface TransactionsFilterProps {
  search: string;
  setSearch: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
}

const TransactionsFilter: React.FC<TransactionsFilterProps> = ({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <input
        type="text"
        placeholder="جستجو..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none"
      />
      <TransactionFormDatePicker
        value={startDate}
        onChange={(val) => setStartDate(val)}
        placeholder="از تاریخ"
        optional
      />
      <TransactionFormDatePicker
        value={endDate}
        onChange={(val) => setEndDate(val)}
        placeholder="تا تاریخ"
        optional
      />
    </div>
  );
};

export default TransactionsFilter;
