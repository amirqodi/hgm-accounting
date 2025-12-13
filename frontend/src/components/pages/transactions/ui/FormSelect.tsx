"use client";

import { Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Banknote, User, CreditCard } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";

type AnimatedDropdownSelectProps = {
  name: string;
  control: any;
  label?: string;
  placeholder?: string;
  options: {
    value: string | number | undefined;
    label: string;
    type?: "bank" | "user" | "card";
  }[];
  disabled?: boolean;
  onSearch?: (term: string) => void;
};

export default function AnimatedDropdownSelect({
  name,
  control,
  label,
  placeholder,
  options,
  disabled,
  onSearch,
}: AnimatedDropdownSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium mb-1 block">{label}</label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="relative">
            {/* دکمه اصلی */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "h-11 w-full px-3 rounded-lg border border-border/20 bg-box text-foreground flex items-center justify-between",
                fieldState.error ? "border-destructive" : "",
                "focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
              )}
            >
              <span>
                {options.find((o) => o.value === field.value)?.label ||
                  placeholder}
              </span>
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IoIosArrowDown />
              </motion.span>
            </button>

            {/* پیام خطا */}
            {fieldState.error && (
              <p className="text-destructive text-sm mt-1">
                {fieldState.error.message}
              </p>
            )}

            {/* لیست آپشن‌ها */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-20 mt-1 w-full bg-box border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {/* input سرچ فقط اگر گزینه‌ها بیشتر از 10 باشد */}
                  {options.length > 10 && (
                    <div className="p-2 border-b border-border">
                      <input
                        type="text"
                        placeholder="جستجو..."
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-border bg-background focus:outline-none"
                      />
                    </div>
                  )}

                  {/* لیست آپشن‌ها */}
                  <ul className="max-h-60 overflow-y-auto">
                    {options.map((opt) => (
                      <li
                        key={opt.value}
                        onClick={() => {
                          field.onChange(opt.value);
                          setOpen(false);
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-muted/25 flex items-center gap-2"
                      >
                        {opt.type === "bank" ? (
                          <Banknote className="h-4 w-4 text-mute" />
                        ) : opt.type === "card" ? (
                          <CreditCard className="h-4 w-4 text-mute" />
                        ) : (
                          <User className="h-4 w-4 text-mute" />
                        )}
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      />
    </div>
  );
}
