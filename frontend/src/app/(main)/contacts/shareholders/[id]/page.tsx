"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import {
  shareholderUpdateSchema,
  ShareholderUpdateFormData,
} from "@/types/contactUpdateSchema";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/main/NotificationProvider";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const router = useRouter();
  const { notify } = useNotification();

  const {
    register,
    setError,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting, isDirty },
  } = useForm<ShareholderUpdateFormData>({
    resolver: zodResolver(shareholderUpdateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  // گرفتن اطلاعات اولیه مشتری
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/contacts/${id}/`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          if (errData) {
            Object.entries(errData).forEach(([field, messages]: any) => {
              setError(field as keyof ShareholderUpdateFormData, {
                type: "server",
                message: Array.isArray(messages) ? messages[0] : messages,
              });
            });
          }
          return;
        }

        const data = await res.json();
        setFullName(data.first_name + " " + data.last_name);
        reset(data); // پر کردن فرم با داده‌ها
        setAmount(data.amount);
      } catch (err: any) {
        setServerError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, reset]);

  // ارسال اطلاعات ویرایش‌شده
  const onSubmit = async (values: ShareholderUpdateFormData) => {
    if (Object.keys(dirtyFields).length === 0) {
      notify("error", "هیچ تغییری در اطلاعات نداده‌اید.");

      return;
    }

    try {
      const token = Cookies.get("auth_token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contacts/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...values,
            contact_type: "customer",
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        if (errData) {
          Object.entries(errData).forEach(([field, error]: any) => {
            setError(field as keyof ShareholderUpdateFormData, {
              type: "server",
              message: Array.isArray(error) ? error[0] : error,
            });
          });
        }
        return;
      }

      notify("success", "ویرایش اطلاعات با موفقیت انجام شد");
      router.push("/contacts/shareholders");
    } catch (err: any) {
      notify("error", err.error || "خطا در ویرایش اطلاعات");
    }
  };

  if (loading) return <p>در حال بارگذاری...</p>;
  if (serverError) return <p className="text-red-500">{serverError}</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{fullName} - مشتری</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 bg-box rounded-lg p-5 flex flex-col items-end"
      >
        <div className="w-full flex flex-col gap-2 my-2">
          <div className="w-full px-5 flex justify-between items-center gap-3">
            <label className="p-2">نام</label>
            <input
              {...register("first_name")}
              className="w-[78%] border-background border-2 rounded-lg p-2"
            />
          </div>
          {errors.first_name && (
            <p className="text-red-500">{errors.first_name.message}</p>
          )}
        </div>

        <div className="w-full flex flex-col gap-2 my-2">
          <div className="w-full px-5 flex justify-between items-center gap-3">
            <label>نام خانوادگی</label>
            <input
              {...register("last_name")}
              className="w-[78%] border-background border-2 rounded-lg p-2"
            />
          </div>
          {errors.last_name && (
            <p className="text-red-500">{errors.last_name.message}</p>
          )}
        </div>

        <div className="w-full flex flex-col gap-2 my-2">
          <div className="w-full px-5 flex justify-between items-center gap-3">
            <label>شماره تلفن</label>
            <input
              {...register("phone_number")}
              className="w-[78%] border-background border-2 rounded-lg p-2"
            />
          </div>
          {errors.phone_number && (
            <p className="text-red-500">{errors.phone_number.message}</p>
          )}
        </div>
        <div className="w-full flex flex-col gap-2 my-2">
          <div className="w-full px-5 flex justify-between items-center gap-3">
            <label>درصد سهم</label>
            <input
              {...register("share_percentage")}
              className="w-[78%] border-background border-2 rounded-lg p-2"
            />
          </div>
          {errors.share_percentage && (
            <p className="text-red-500">{errors.share_percentage.message}</p>
          )}
        </div>
        <div className="w-full flex flex-col gap-2 my-2">
          <div className="w-full px-5 flex justify-between items-center gap-3">
            <label>مقدار سرمایه</label>
            <input
              className="w-[78%] border-background border-2 rounded-lg p-2"
              defaultValue={amount}
              readOnly
            />
          </div>
          {errors.share_percentage && (
            <p className="text-red-500">{errors.share_percentage.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed mt-3"
        >
          {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </form>
    </div>
  );
}
