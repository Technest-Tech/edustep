"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { canAccessPath, homeForRole } from "@/lib/auth-routing";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    if (
      !isLoading &&
      user &&
      (user.must_change_password || user.requires_two_factor_setup) &&
      pathname !== "/security"
    ) {
      router.replace("/security");
      return;
    }

    if (!isLoading && user && !canAccessPath(user.role, pathname)) {
      router.replace(homeForRole(user.role));
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-cloud">
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-2xl bg-navy" />
            <div className="absolute inset-1 animate-pulse rounded-xl bg-teal" />
          </div>
          <p className="text-xs font-medium text-slate">جاري تجهيز مساحة العمل...</p>
        </div>
      </div>
    );
  }

  if (
    (user.must_change_password || user.requires_two_factor_setup) &&
    pathname !== "/security"
  ) {
    return (
      <div className="grid min-h-screen place-items-center bg-cloud">
        <p className="text-xs font-medium text-slate">
          جاري فتح مركز أمان الحساب...
        </p>
      </div>
    );
  }

  if (!canAccessPath(user.role, pathname)) {
    return (
      <div className="grid min-h-screen place-items-center bg-cloud">
        <p className="text-xs font-medium text-slate">جاري فتح مساحتك المناسبة...</p>
      </div>
    );
  }

  return children;
}
