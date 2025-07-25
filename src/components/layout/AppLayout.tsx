"use client";

import { usePathname } from "next/navigation";
import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/" ||
    pathname === "/reset-password";

  if (isAuthPage) return <>{children}</>;

  if (user)
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-16 md:ml-64 min-h-screen transition-all bg-background">
          {children}
        </main>
      </div>
    );
}
