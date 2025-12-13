"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-600">
          {label}
        </label>
        <input
          ref={ref}
          {...props}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring
            ${error ? "border-red-500" : "border-gray-300"}
          `}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
