"use client";
import { Controller, Control, useWatch } from "react-hook-form";
import React, { useState, useEffect } from "react";

type NumberInputProps = {
  name: string;
  control: Control<any>;
  placeholder?: string;
  label?: string;
};

export default function NumberInput({
  name,
  control,
  placeholder,
  label,
}: NumberInputProps) {
  // ⚡ مقدار field از فرم را مستقیماً می‌بینیم
  const fieldValue = useWatch({ control, name });
  const [inputValue, setInputValue] = useState<string>("");

  // ⚡ همگام‌سازی state با مقدار فرم
  useEffect(() => {
    const raw = fieldValue ?? "";
    const str = String(raw).replace(/\D/g, "");
    setInputValue(str.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }, [fieldValue]);

  const formatNumber = (val: string) => {
    const str = val.replace(/\D/g, "");
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value.replace(/\D/g, "");
          setInputValue(formatNumber(raw));
          field.onChange(raw ? Number(raw) : "");
        };

        return (
          <div className="w-full">
            {label && (
              <label className="text-sm font-medium mb-1 block">{label}</label>
            )}
            <input
              type="text"
              value={inputValue}
              placeholder={placeholder}
              onChange={handleChange}
              className={`h-11 w-full px-3 rounded-lg border ${
                fieldState.error
                  ? "border-destructive focus:ring-destructive"
                  : "border-border/20 focus:ring-primary"
              } bg-box text-foreground focus:ring-2 focus:outline-none`}
              dir="ltr"
            />
            {fieldState.error && (
              <p className="mt-1 text-xs text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
