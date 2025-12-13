"use client";

import { useState, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FiUpload, FiX, FiFile } from "react-icons/fi";
import { cn } from "@/lib/utils";

type AttachmentsFieldProps = {
  name?: string;
  label?: string;
};

export default function AttachmentsField({
  name = "attachments",
  label,
}: AttachmentsFieldProps) {
  const { control, setValue, watch } = useFormContext();
  const files = watch(name) || [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const arr = Array.from(selectedFiles);
    setValue(name, [...files, ...arr]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setValue(name, newFiles);
  };

  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className="flex flex-col gap-2">
          {label && <label className="text-sm font-medium">{label}</label>}

          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-primary/10"
                : "border-border bg-box",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <FiUpload className="h-6 w-6 text-muted mb-2" />
            <span className="text-sm text-muted text-center">
              فایل‌ها را بکشید یا کلیک کنید <br />
              (تصویر، PDF، Excel و فایل‌های حسابداری)
            </span>
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx,.csv"
            />
          </div>

          {/* لیست فایل‌ها */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {files.map((file: File, idx: number) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 border border-border rounded-lg overflow-hidden flex items-center justify-center bg-box"
                >
                  {/* تصویر یا آیکون */}
                  {isImage(file) ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted text-sm px-2 text-center">
                      <FiFile className="w-6 h-6 mb-1" />
                      <span className="truncate text-xs">{file.name}</span>
                    </div>
                  )}

                  {/* دکمه حذف */}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full hover:bg-destructive/20 text-destructive"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
