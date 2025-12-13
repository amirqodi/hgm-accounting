"use client";

import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import jalaali from "jalaali-js";
import { motion, AnimatePresence } from "framer-motion";
import { MdDelete } from "react-icons/md";
import "dayjs/locale/fa";
dayjs.locale("fa");

interface FormDatePickerProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  optional?: boolean;
}

export function parseJalaliToGregorian(jalaliDate: string) {
  const [jy, jm, jd] = jalaliDate.split(/[\/\-]/).map(Number);
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

function formatJalali(date: Date | string) {
  const d = dayjs(date);
  const { jy, jm, jd } = jalaali.toJalaali(d.year(), d.month() + 1, d.date());
  return `${jy}/${jm.toString().padStart(2, "0")}/${jd
    .toString()
    .padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const { gy, gm } = jalaali.toGregorian(year, month, 1);
  return new Date(gy, gm, 0).getDate();
}

const TransactionFormDatePicker: React.FC<FormDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  optional = false,
}) => {
  const today = dayjs();
  const jalaliToday = jalaali.toJalaali(
    today.year(),
    today.month() + 1,
    today.date()
  );

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentYear, setCurrentYear] = useState(jalaliToday.jy);
  const [currentMonth, setCurrentMonth] = useState(jalaliToday.jm);
  const [mode, setMode] = useState<"days" | "month" | "year">("days");
  const [yearPage, setYearPage] = useState(3);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
        setMode("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const years = Array.from({ length: 100 }, (_, i) => jalaliToday.jy - 50 + i);
  const yearsPerPage = 16;

  return (
    <div className="relative w-44" ref={calendarRef}>
      <input
        type="text"
        value={value || ""}
        readOnly
        placeholder={placeholder || "yyyy/mm/dd"}
        onClick={() => setShowCalendar(true)}
        className="h-11 w-full px-3 rounded-lg border border-border/20 bg-box text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
      />
      {optional && value && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          className="absolute top-1/2 transform -translate-y-1/2 left-2 p-1 rounded-full hover:bg-red-500"
        >
          <MdDelete />
        </button>
      )}

      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 bg-background border rounded-lg shadow-lg p-4 z-50 w-72"
          >
            {/* هدر */}
            <div className="flex justify-between items-center mb-2">
              {mode === "days" && (
                <>
                  <button
                    onClick={() => {
                      if (currentMonth === 1) {
                        setCurrentMonth(12);
                        setCurrentYear((y) => y - 1);
                      } else setCurrentMonth((m) => m - 1);
                    }}
                  >
                    ‹
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setMode("month")}
                      className="font-semibold"
                    >
                      {monthNames[currentMonth - 1]}
                    </button>
                    <button
                      onClick={() => setMode("year")}
                      className="font-semibold"
                    >
                      {currentYear}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (currentMonth === 12) {
                        setCurrentMonth(1);
                        setCurrentYear((y) => y + 1);
                      } else setCurrentMonth((m) => m + 1);
                    }}
                  >
                    ›
                  </button>
                </>
              )}
              {mode === "month" && (
                <span className="text-center font-semibold">انتخاب ماه</span>
              )}
              {mode === "year" && (
                <span className="text-center font-semibold">انتخاب سال</span>
              )}
            </div>

            {/* محتوا */}
            {mode === "days" && (
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from(
                  { length: getMonthDays(currentYear, currentMonth) },
                  (_, i) => i + 1
                ).map((day) => {
                  const dateStr = `${currentYear}/${currentMonth
                    .toString()
                    .padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
                  const selected = value === dateStr;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        onChange?.(dateStr);
                        setShowCalendar(false);
                      }}
                      className={`p-1 rounded hover:bg-muted ${
                        selected ? "bg-primary text-white" : ""
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}

            {mode === "month" && (
              <div className="grid grid-cols-3 grid-rows-4 gap-1 h-60">
                {monthNames.map((mName, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentMonth(index + 1);
                      setMode("days");
                    }}
                    className={`p-2 rounded hover:bg-muted ${
                      currentMonth === index + 1 ? "bg-primary text-white" : ""
                    }`}
                  >
                    {mName}
                  </button>
                ))}
              </div>
            )}

            {mode === "year" && (
              <div>
                <div className="grid grid-cols-4 grid-rows-4 gap-1 h-60">
                  {years
                    .slice(
                      yearPage * yearsPerPage,
                      (yearPage + 1) * yearsPerPage
                    )
                    .map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setCurrentYear(y);
                          setMode("month");
                        }}
                        className={`p-2 rounded hover:bg-muted ${
                          currentYear === y ? "bg-primary text-white" : ""
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                  <button
                    disabled={yearPage === 0}
                    onClick={() => setYearPage((p) => p - 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <button
                    disabled={(yearPage + 1) * yearsPerPage >= years.length}
                    onClick={() => setYearPage((p) => p + 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionFormDatePicker;
