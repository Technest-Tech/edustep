"use client";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError, getCsrfCookie } from "@/lib/api/client";
import type { ApiItem } from "@/types/api";
import { BadgeCheck, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm({
  token,
  initialEmail,
}: {
  token: string;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await getCsrfCookie();
      await apiClient<ApiItem<{ message: string }>>(
        "/api/v1/auth/reset-password",
        {
          method: "POST",
          json: {
            token,
            email,
            password,
            password_confirmation: confirmation,
          },
        },
      );
      setComplete(true);
    } catch (value) {
      setError(
        value instanceof ApiError
          ? Object.values(value.errors).flat()[0] ?? value.message
          : "تعذر تغيير كلمة المرور. اطلب رابطًا جديدًا.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-7 rounded-2xl border border-rose-100 bg-rose-50 p-5">
        <p className="text-[11px] font-bold text-rose-800">الرابط غير مكتمل</p>
        <p className="mt-2 text-[9px] leading-6 text-rose-700">
          اطلب رابط إعادة تعيين جديد من صفحة تسجيل الدخول.
        </p>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <BadgeCheck className="text-emerald-600" size={24} />
        <p className="mt-3 text-[11px] font-bold text-emerald-900">
          تم تغيير كلمة المرور
        </p>
        <p className="mt-2 text-[9px] leading-6 text-emerald-800">
          أُغلقت الجلسات القديمة. استخدم كلمة المرور الجديدة للدخول.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-navy px-4 text-[10px] font-semibold text-white"
        >
          تسجيل الدخول الآن
        </Link>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="mt-7 space-y-4">
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[9px] text-rose-700">
          {error}
        </p>
      ) : null}
      <RecoveryField label="البريد الإلكتروني" id="reset-email">
        <input
          id="reset-email"
          dir="ltr"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </RecoveryField>
      <RecoveryField label="كلمة المرور الجديدة" id="reset-password">
        <span className="flex items-center gap-3">
          <LockKeyhole size={16} className="shrink-0 text-slate/60" />
          <input
            id="reset-password"
            dir="ltr"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            className="text-slate/55"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </RecoveryField>
      <RecoveryField label="تأكيد كلمة المرور" id="reset-password-confirmation">
        <input
          id="reset-password-confirmation"
          dir="ltr"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
      </RecoveryField>
      <p className="text-[8px] leading-5 text-slate">
        10 أحرف على الأقل، وتشمل حرفًا كبيرًا وصغيرًا ورقمًا.
      </p>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
      </Button>
    </form>
  );
}

function RecoveryField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[10px] font-semibold text-navy">
        {label}
      </label>
      <div className="[&>input]:min-h-12 [&>input]:w-full [&>input]:rounded-[14px] [&>input]:border [&>input]:border-navy/[0.1] [&>input]:bg-cloud/60 [&>input]:px-4 [&>input]:text-xs [&>input]:text-ink [&>input]:outline-none [&>span]:min-h-12 [&>span]:rounded-[14px] [&>span]:border [&>span]:border-navy/[0.1] [&>span]:bg-cloud/60 [&>span]:px-4 [&_input]:bg-transparent [&_input]:text-xs [&_input]:text-ink [&_input]:outline-none">
        {children}
      </div>
    </div>
  );
}
