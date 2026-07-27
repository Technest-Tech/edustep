"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { homeForRole } from "@/lib/auth-routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("اكتب بريدًا إلكترونيًا صحيحًا."),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف."),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { user, isLoading: loadingUser, login, completeTwoFactor } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  useEffect(() => {
    if (!loadingUser && user) {
      router.replace(homeForRole(user.role));
    }
  }, [loadingUser, router, user]);

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      const result = await login(values);

      if (result.status === "two_factor_required") {
        setTwoFactorRequired(true);
        return;
      }

      router.replace(homeForRole(result.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(
          error.errors.email?.[0] ?? "تعذر تسجيل الدخول بهذه البيانات.",
        );
        return;
      }

      setServerError("تعذر الاتصال بالنظام. تأكد أن الـAPI يعمل.");
    }
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setIsVerifying(true);

    try {
      const loggedInUser = await completeTwoFactor(twoFactorCode);
      router.replace(homeForRole(loggedInUser.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(
          error.errors.code?.[0] ?? "رمز التحقق أو الاسترداد غير صحيح.",
        );
      } else {
        setServerError("تعذر الاتصال بالنظام. حاول مرة أخرى.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  if (twoFactorRequired) {
    return (
      <form
        method="post"
        onSubmit={verifyTwoFactor}
        className="mt-8 space-y-5"
      >
        <div className="rounded-2xl border border-teal/20 bg-mist/70 p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-sun">
              <ShieldCheck size={19} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-navy">
                تحقق بخطوتين
              </p>
              <p className="mt-1 text-[9px] leading-5 text-slate">
                اكتب الرمز الحالي من تطبيق المصادقة، أو استخدم أحد رموز
                الاسترداد المحفوظة.
              </p>
            </div>
          </div>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] leading-5 text-rose-700"
          >
            {serverError}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="two-factor-code"
            className="mb-2 block text-[11px] font-semibold text-navy"
          >
            رمز التحقق أو الاسترداد
          </label>
          <div className="flex min-h-12 items-center gap-3 rounded-[14px] border border-navy/[0.1] bg-white px-4 focus-within:border-teal/60 focus-within:ring-4 focus-within:ring-teal/10">
            <KeyRound size={17} className="text-slate/65" />
            <input
              id="two-factor-code"
              dir="ltr"
              autoComplete="one-time-code"
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-center font-mono text-sm tracking-[0.22em] text-ink outline-none"
              placeholder="000000"
              required
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isVerifying}
        >
          {isVerifying ? "جاري التحقق..." : "تأكيد الدخول الآمن"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setTwoFactorRequired(false);
            setTwoFactorCode("");
            setServerError(null);
          }}
          className="w-full text-center text-[9px] font-semibold text-teal"
        >
          العودة لبيانات الدخول
        </button>
      </form>
    );
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 space-y-5"
    >
      {serverError ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] leading-5 text-rose-700"
        >
          {serverError}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-[11px] font-semibold text-navy"
        >
          البريد الإلكتروني
        </label>
        <div className="flex min-h-12 items-center gap-3 rounded-[14px] border border-navy/[0.1] bg-white px-4 transition focus-within:border-teal/60 focus-within:ring-4 focus-within:ring-teal/10">
          <Mail size={17} className="text-slate/65" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="mt-1.5 text-[10px] text-rose-600">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-[11px] font-semibold text-navy">
            كلمة المرور
          </label>
          <Link href="/forgot-password" className="text-[9px] font-semibold text-teal">
            نسيت كلمة المرور؟
          </Link>
        </div>
        <div className="flex min-h-12 items-center gap-3 rounded-[14px] border border-navy/[0.1] bg-white px-4 transition focus-within:border-teal/60 focus-within:ring-4 focus-within:ring-teal/10">
          <LockKeyhole size={17} className="text-slate/65" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="text-slate/55 hover:text-navy"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-1.5 text-[10px] text-rose-600">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <label className="flex w-fit items-center gap-2 text-[10px] text-slate">
        <input
          type="checkbox"
          className="size-4 rounded border-navy/15 accent-teal"
          {...register("remember")}
        />
        تذكّرني على هذا الجهاز
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "جاري تسجيل الدخول..." : "دخول إلى مساحة العمل"}
        {!isSubmitting ? <ChevronIcon /> : null}
      </Button>
    </form>
  );
}

function ChevronIcon() {
  return (
    <span aria-hidden="true" className="text-base leading-none">
      ←
    </span>
  );
}
