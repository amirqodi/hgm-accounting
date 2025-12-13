"use client";
import React from "react";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-600">{label}</label>
        <textarea
          ref={ref}
          {...props}
          className={`w-full rounded-md border px-3 py-2 bg-box focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
export default TextArea;
