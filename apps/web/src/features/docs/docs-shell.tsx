"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { homeForRole } from "@/lib/auth-routing";
import { BookOpenText, ExternalLink, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function DocsShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const workspaceHref = homeForRole(user?.role ?? "staff");

  return (
    <div className="min-h-screen bg-[#fbfcfe] text-ink">
      <header className="sticky top-0 z-40 border-b border-navy/[0.07] bg-white/95 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/docs"
            className="flex min-w-0 items-center gap-3"
            aria-label="دليل تشغيل EduStep"
          >
            <Image
              src="/brand/edustep-logo-primary.svg"
              alt="EduStep English Academy"
              width={148}
              height={43}
              priority
              className="h-auto w-[118px] sm:w-[142px]"
            />
            <span className="hidden h-8 w-px bg-navy/10 sm:block" />
            <span className="hidden sm:block">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy">
                <BookOpenText size={15} className="text-teal" />
                دليل التشغيل
              </span>
              <span className="mt-0.5 block text-[8px] text-slate">
                مرجع فريق الأكاديمية
              </span>
            </span>
          </Link>

          <div className="mr-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[8px] font-semibold text-emerald-700 lg:inline-flex">
              محدث حسب النسخة الحالية
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="grid size-10 place-items-center rounded-xl border border-navy/[0.08] bg-white text-slate transition hover:border-teal/25 hover:text-navy"
              aria-label="طباعة دليل التشغيل"
              title="طباعة الدليل"
            >
              <Printer size={17} />
            </button>
            <Link
              href={workspaceHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-navy px-3.5 text-[9px] font-semibold text-white shadow-[0_8px_22px_rgba(11,36,84,.16)] transition hover:bg-navy-soft sm:px-4"
            >
              العودة للنظام
              <ExternalLink size={14} className="text-sun" />
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
