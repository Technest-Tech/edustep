import { LoginForm } from "@/components/auth/login-form";
import { BarChart3, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col xl:p-16">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute -bottom-32 right-10 size-[430px] rounded-full bg-sun/10 blur-3xl" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative">
          <Image
            src="/brand/edustep-logo-reversed.svg"
            alt="EduStep English Academy"
            width={218}
            height={63}
            priority
            className="h-auto w-[218px]"
          />
        </div>

        <div className="relative my-auto max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[10px] text-white/70">
            <Sparkles size={14} className="text-sun" />
            Academy Operations System
          </div>
          <h1 className="text-4xl font-bold leading-[1.45] tracking-tight xl:text-5xl">
            كل تفاصيل الأكاديمية،
            <span className="block text-teal-bright">في مكان واحد واضح.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-8 text-white/60">
            تابع العملاء، الجروبات، الطلاب، المعلمين والتحصيل من مساحة عمل
            مصممة لاتخاذ القرار بسرعة.
          </p>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              [BarChart3, "رؤية تشغيلية لحظية"],
              [CheckCircle2, "متابعة دون نسيان"],
              [ShieldCheck, "صلاحيات وبيانات آمنة"],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof BarChart3;

              return (
                <div
                  key={label as string}
                  className="rounded-2xl border border-white/10 bg-white/[0.065] p-4"
                >
                  <FeatureIcon size={19} className="text-sun" />
                  <p className="mt-3 text-[10px] leading-5 text-white/65">
                    {label as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-[9px] text-white/35">
          EduStep Academy OS · Built for focused growth
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-cloud/65 px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Image
            src="/brand/edustep-logo-primary.svg"
            alt="EduStep English Academy"
            width={190}
            height={55}
            priority
            className="mb-10 h-auto w-[190px] lg:hidden"
          />
          <p className="text-[10px] font-semibold text-teal">مرحبًا بعودتك</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">
            تسجيل الدخول
          </h2>
          <p className="mt-3 text-xs leading-6 text-slate">
            استخدم حسابك للدخول إلى مساحة الإدارة أو المعلم أو الأسرة.
          </p>

          <LoginForm />

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-7 rounded-2xl border border-navy/[0.07] bg-white px-4 py-3">
              <p className="text-[9px] font-semibold text-navy">حسابات التجربة المحلية</p>
              <div className="mt-2 space-y-1 text-[8px] leading-5 text-slate">
                <p>الإدارة: admin@edustep.local</p>
                <p>المعلم: sara@edustep.local</p>
                <p>ولي الأمر: parent@edustep.local</p>
                <p className="pt-1 font-semibold text-navy">كلمة المرور للجميع: Admin@12345</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
