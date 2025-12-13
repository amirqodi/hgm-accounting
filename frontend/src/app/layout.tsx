import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/main/NotificationProvider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حسابداری",
  description: "اپ حسابداری",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} font-vazirmatn min-h-screen w-full`}
      >
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
