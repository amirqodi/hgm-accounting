"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline";
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<typeof variant, string> = {
    primary: "bg-primary text-white hover:brightness-110",
    secondary: "bg-secondary text-white hover:brightness-110",
    destructive: "bg-destructive text-white hover:brightness-110",
    outline: "border border-border bg-box hover:bg-muted/10",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}
