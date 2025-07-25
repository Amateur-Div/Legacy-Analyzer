"use client";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!auth.currentUser?.emailVerified) {
        toast.info("Verify your email!", {
          description:
            "Your email is not verified. Please verify before continuing.",
        });
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="max-w-xl mx-auto mt-20 dark:bg-zinc-800/70 text-center flex">
      <main className="flex-grow p-6">
        <h1 className="text-3xl font-bold">Welcome to your dashboard</h1>
      </main>
    </div>
  );
}
