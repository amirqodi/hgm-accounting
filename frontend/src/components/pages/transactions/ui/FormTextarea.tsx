"use client";

import { motion } from "framer-motion";
import { Controller } from "react-hook-form";

type Option = {
  value: string | number;
  label: string;
};

interface AnimatedSelectProps {
  name: string;
  control: any;
  label?: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
}

export default function AnimatedSelect({
  name,
  control,
  label,
  placeholder = "انتخاب کنید...",
  options,
  disabled,
}: AnimatedSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <motion.div
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <select
              {...field}
              disabled={disabled}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground shadow-sm 
                         focus:ring-2 focus:ring-primary focus:border-primary 
                         disabled:opacity-50 transition-all duration-200"
            >
              <option value="">{placeholder}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      />
    </div>
  );
}
