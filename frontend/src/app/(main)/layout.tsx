// main/layout.tsx
import React from "react";
import Sidebar from "@/components/main/SideBar";
import NavBar from "@/components/main/NavBar";
import ProtectedLayout from "@/components/main/ProtectedLayout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="flex min-h-screen w-full">
        {/* Sidebar on the right */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <NavBar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ProtectedLayout>
  );
}
