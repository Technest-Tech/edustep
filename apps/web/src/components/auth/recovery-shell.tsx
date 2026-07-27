import { ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function RecoveryShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-cloud px-5 py-10">
      <div className="absolute -right-40 -top-40 size-[480px] rounded-full bg-teal/10 blur-3xl" />
      <div className="absolute -bottom-48 -left-36 size-[520px] rounded-full bg-sun/15 blur-3xl" />
      <section className="relative w-full max-w-[470px] rounded-[28px] border border-navy/[0.065] bg-white p-6 shadow-[0_30px_90px_rgba(11,36,84,.1)] sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/edustep-logo-primary.svg"
            alt="EduStep English Academy"
            width={168}
            height={49}
            priority
            className="w-[168px]"
            style={{ height: "auto" }}
          />
          <div className="grid size-11 place-items-center rounded-2xl bg-navy text-sun">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="mt-9">
          <p className="text-[9px] font-bold tracking-[0.16em] text-teal">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy">
            {title}
          </h1>
          <p className="mt-3 text-[10px] leading-6 text-slate">{description}</p>
        </div>

        {children}

        <Link
          href="/login"
          className="mt-7 flex items-center justify-center gap-2 text-[9px] font-semibold text-teal"
        >
          <ArrowRight size={14} />
          العودة لتسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
