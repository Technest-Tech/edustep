"use client";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError, getCsrfCookie } from "@/lib/api/client";
import type { ApiItem } from "@/types/api";
import { BadgeCheck, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await getCsrfCookie();
      await apiClient<ApiItem<{ message: string }>>(
        "/api/v1/auth/forgot-password",
        {
          method: "POST",
          json: { email },
        },
      );
      setSent(true);
    } catch (value) {
      setError(
        value instanceof ApiError
          ? value.errors.email?.[0] ?? value.message
          : "تعذر إرسال الطلب الآن. حاول مرة أخرى.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <BadgeCheck className="text-emerald-600" size={24} />
        <p className="mt-3 text-[13px] font-bold text-emerald-900">
          راجع بريدك الإلكتروني
        </p>
        <p className="mt-2 text-[12px] leading-6 text-emerald-800">
          إذا كان البريد مرتبطًا بحساب، ستصلك رسالة بها رابط مؤقت. افحص مجلد
          الرسائل غير المرغوبة أيضًا.
        </p>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="mt-7 space-y-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[12px] text-rose-700">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="recovery-email" className="mb-2 block text-[12px] font-semibold text-navy">
          البريد الإلكتروني للحساب
        </label>
        <div className="flex min-h-12 items-center gap-3 rounded-[14px] border border-navy/[0.1] bg-cloud/60 px-4 focus-within:border-teal/60 focus-within:ring-4 focus-within:ring-teal/10">
          <Mail size={17} className="text-slate/60" />
          <input
            id="recovery-email"
            dir="ltr"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
            required
            autoFocus
          />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "جاري الإرسال..." : "إرسال رابط آمن"}
      </Button>
    </form>
  );
}
