"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("auth_token");

    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  return <>{children}</>;
}
