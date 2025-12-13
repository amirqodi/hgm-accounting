// app/auth/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Cookies from "js-cookie";
import { useNotification } from "@/components/main/NotificationProvider";

// ✅ Zod validation schema
const loginSchema = z.object({
  username: z.string().min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد"),
  password: z.string().min(3, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { notify } = useNotification();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError("");

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await res.json(); // فقط یک بار

      if (!res.ok) {
        if (result) {
          Object.entries(result).forEach(([field, error]: any) => {
            setError(field as keyof LoginFormData, {
              type: "server",
              message: Array.isArray(error) ? error[0] : error,
            });
          });
        }
        // اگر پیغام کلی اومده باشه
        if (result.error) {
          setServerError(result.error);
          notify("error", result.error);
        }
        return;
      }

      // اگر موفق بود
      if (result?.token) {
        Cookies.set("auth_token", result.token, { expires: 1 });
        router.push("/");
        return;
      }
    } catch (err: any) {
      console.log(err);
      setServerError(err.error || "مشکلی پیش آمد");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-box p-8 rounded-2xl shadow-2xl w-lg"
      >
        <h1 className="text-3xl font-bold mb-20 text-foreground text-center">
          ورود به حساب
        </h1>

        {serverError && (
          <p className="text-destructive text-sm mb-4 text-center">
            {serverError}
          </p>
        )}

        {/* Username */}
        <div className="mb-8">
          <label className="block mb-1 text-sm font-medium text-foreground">
            نام کاربری
          </label>
          <div className="relative">
            <User className="absolute left-3 top-4 text-muted" size={18} />
            <input
              type="text"
              placeholder="نام کاربری"
              {...register("username")}
              className="w-full pl-10 pr-3 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
          </div>
          {errors.username && (
            <p className="text-destructive text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-8">
          <label className="block mb-1 text-sm font-medium text-foreground">
            رمز عبور
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-muted" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="رمز عبور"
              {...register("password")}
              className="w-full pl-10 pr-10 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-2.5 text-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-primary text-white py-2 rounded-lg hover:brightness-110 transition disabled:opacity-50"
        >
          {isSubmitting ? "در حال ورود..." : "ورود"}
        </motion.button>
      </motion.form>
    </div>
  );
}
