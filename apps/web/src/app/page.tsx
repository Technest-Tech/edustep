"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { homeForRole } from "@/lib/auth-routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? homeForRole(user.role) : "/login");
    }
  }, [isLoading, router, user]);

  return (
    <main className="grid min-h-screen place-items-center bg-cloud">
      <p className="text-xs font-medium text-slate">جاري فتح مساحة العمل...</p>
    </main>
  );
}
