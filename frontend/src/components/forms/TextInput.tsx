"use client";
import React, { useState, useEffect } from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  thousandSeparator?: boolean; // prop جدید
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, thousandSeparator, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>("");

    useEffect(() => {
      if (value != null && value !== "") {
        const num =
          typeof value === "number"
            ? value
            : Number(String(value).replace(/,/g, ""));
        setDisplayValue(
          thousandSeparator && !isNaN(num)
            ? num.toLocaleString("en-US")
            : String(value)
        );
      } else {
        setDisplayValue("");
      }
    }, [value, thousandSeparator]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value;
      if (thousandSeparator) {
        rawValue = rawValue.replace(/\D/g, ""); // فقط اعداد
        setDisplayValue(rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      } else {
        setDisplayValue(rawValue);
      }

      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: rawValue },
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-600">{label}</label>
        <input
          ref={ref}
          {...props}
          value={displayValue}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 bg-box focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
export default TextInput;
