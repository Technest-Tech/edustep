"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatDateTime, relativeTime } from "@/lib/format";
import type {
  AccountSecurityData,
  ApiItem,
  SecuritySession,
  User,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CircleAlert,
  Clipboard,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactElement, type ReactNode } from "react";

type SetupData = {
  secret: string;
  provisioning_uri: string;
  expires_at: string;
};

export function AccountSecurityCenter() {
  const query = useQuery({
    queryKey: ["account-security"],
    queryFn: () =>
      apiClient<ApiItem<AccountSecurityData>>("/api/v1/me/security"),
  });

  if (query.isLoading) {
    return <SecuritySkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="grid min-h-96 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">
            تعذر تحميل مركز أمان الحساب
          </h1>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const security = query.data.data;
  const needsAction =
    security.user.must_change_password ||
    (security.two_factor.required && !security.two_factor.enabled);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACCOUNT SECURITY"
        title="أمان الحساب"
        description="تحكم في كلمة المرور، التحقق بخطوتين، رموز الاسترداد، والأجهزة التي ما زالت مسجلة الدخول."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw
              size={15}
              className={query.isFetching ? "animate-spin" : ""}
            />
            تحديث
          </Button>
        }
      />

      {needsAction ? (
        <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <CircleAlert className="mt-0.5 shrink-0" size={19} />
          <div>
            <p className="text-[11px] font-bold">إجراء أمني مطلوب</p>
            <p className="mt-1 text-[9px] leading-5">
              {security.user.must_change_password
                ? "غيّر كلمة المرور المؤقتة أولًا. سيظل الوصول لباقي النظام مقيدًا حتى إتمام ذلك."
                : "فعّل التحقق بخطوتين لهذا الحساب المميز قبل متابعة العمل داخل النظام."}
            </p>
          </div>
        </section>
      ) : (
        <section className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
          <BadgeCheck className="mt-0.5 shrink-0" size={19} />
          <div>
            <p className="text-[11px] font-bold">الحساب مستوفٍ لمتطلبات الأمان</p>
            <p className="mt-1 text-[9px] leading-5">
              راجع الجلسات المفتوحة ورموز الاسترداد دوريًا، خصوصًا عند تغيير
              جهاز أو موظف.
            </p>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <SecurityMetric
          icon={LockKeyhole}
          label="كلمة المرور"
          value={security.user.must_change_password ? "مطلوب تغييرها" : "محدّثة"}
          tone={
            security.user.must_change_password
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }
        />
        <SecurityMetric
          icon={ShieldCheck}
          label="التحقق بخطوتين"
          value={security.two_factor.enabled ? "مفعّل" : "غير مفعّل"}
          tone={
            security.two_factor.enabled
              ? "bg-mist text-teal"
              : "bg-rose-50 text-rose-700"
          }
        />
        <SecurityMetric
          icon={Laptop}
          label="الجلسات المفتوحة"
          value={`${security.sessions.length} جهاز`}
          tone="bg-violet-50 text-violet-700"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <PasswordPanel />
        <TwoFactorPanel security={security} />
      </section>

      <SessionsPanel sessions={security.sessions} />
    </div>
  );
}

function PasswordPanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<User>>("/api/v1/me/security/password", {
        method: "PUT",
        json: form,
      }),
    onSuccess: async (response) => {
      queryClient.setQueryData(["auth", "user"], response.data);
      await queryClient.invalidateQueries({ queryKey: ["account-security"] });
      setForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setError(null);
      setNotice("تم تغيير كلمة المرور وإغلاق كل الجلسات الأخرى.");
    },
    onError: (value) => {
      setNotice(null);
      setError(errorMessage(value));
    },
  });

  return (
    <SecurityCard
      icon={LockKeyhole}
      title="كلمة المرور"
      description="استخدم عبارة قوية ومختلفة عن أي حساب شخصي."
    >
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <SecurityField label="كلمة المرور الحالية">
          <input
            dir="ltr"
            type="password"
            autoComplete="current-password"
            value={form.current_password}
            onChange={(event) =>
              setForm({ ...form, current_password: event.target.value })
            }
            required
          />
        </SecurityField>
        <div className="grid gap-4 sm:grid-cols-2">
          <SecurityField label="كلمة المرور الجديدة">
            <input
              dir="ltr"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </SecurityField>
          <SecurityField label="تأكيد كلمة المرور">
            <input
              dir="ltr"
              type="password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(event) =>
                setForm({
                  ...form,
                  password_confirmation: event.target.value,
                })
              }
              required
            />
          </SecurityField>
        </div>
        <p className="text-[8px] leading-5 text-slate">
          10 أحرف على الأقل، وتشمل حرفًا كبيرًا وصغيرًا ورقمًا.
        </p>
        <Feedback error={error} notice={notice} />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
        </Button>
      </form>
    </SecurityCard>
  );
}

function TwoFactorPanel({ security }: { security: AccountSecurityData }) {
  const queryClient = useQueryClient();
  const [setupPassword, setSetupPassword] = useState("");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [action, setAction] = useState<"codes" | "disable" | null>(null);
  const [actionForm, setActionForm] = useState({
    current_password: "",
    code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshSecurity() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["account-security"] }),
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] }),
    ]);
  }

  const setupMutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<SetupData>>("/api/v1/me/security/two-factor/setup", {
        method: "POST",
        json: { current_password: setupPassword },
      }),
    onSuccess: (response) => {
      setSetup(response.data);
      setError(null);
      setNotice(null);
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const confirmMutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<{ message: string; recovery_codes: string[] }>>(
        "/api/v1/me/security/two-factor/confirm",
        {
          method: "POST",
          json: { code: confirmationCode },
        },
      ),
    onSuccess: async (response) => {
      setRecoveryCodes(response.data.recovery_codes);
      setSetup(null);
      setSetupPassword("");
      setConfirmationCode("");
      setError(null);
      await refreshSecurity();
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const codesMutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<{ message: string; recovery_codes: string[] }>>(
        "/api/v1/me/security/two-factor/recovery-codes",
        {
          method: "POST",
          json: actionForm,
        },
      ),
    onSuccess: async (response) => {
      setRecoveryCodes(response.data.recovery_codes);
      setAction(null);
      setActionForm({ current_password: "", code: "" });
      setError(null);
      await refreshSecurity();
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const disableMutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<{ message: string }>>(
        "/api/v1/me/security/two-factor",
        {
          method: "DELETE",
          json: actionForm,
        },
      ),
    onSuccess: async () => {
      setAction(null);
      setActionForm({ current_password: "", code: "" });
      setRecoveryCodes(null);
      setError(null);
      setNotice("تم إيقاف التحقق بخطوتين.");
      await refreshSecurity();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <SecurityCard
      icon={ShieldCheck}
      title="التحقق بخطوتين"
      description="طبقة حماية إضافية للحسابات التي تصل للبيانات المالية والإدارية."
    >
      {recoveryCodes ? (
        <RecoveryCodes
          codes={recoveryCodes}
          onDone={() => {
            setRecoveryCodes(null);
            setNotice("تم حفظ حالة التحقق بخطوتين.");
          }}
        />
      ) : null}

      {!security.two_factor.enabled && !recoveryCodes ? (
        setup ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              confirmMutation.mutate();
            }}
          >
            <div className="rounded-xl bg-navy p-4 text-white">
              <p className="text-[9px] font-semibold text-sun">
                الخطوة 1 · أضف الحساب لتطبيق المصادقة
              </p>
              <p className="mt-2 text-[8px] leading-5 text-white/60">
                افتح Google Authenticator أو Microsoft Authenticator وأدخل
                المفتاح التالي يدويًا.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 p-3">
                <code
                  dir="ltr"
                  className="min-w-0 flex-1 break-all font-mono text-[10px] tracking-wider text-white"
                >
                  {setup.secret}
                </code>
                <CopyButton value={setup.secret} />
              </div>
              <a
                href={setup.provisioning_uri}
                className="mt-3 inline-flex text-[8px] font-semibold text-teal-bright"
              >
                فتح تطبيق المصادقة على هذا الجهاز ←
              </a>
            </div>
            <SecurityField label="الخطوة 2 · الرمز الظاهر في التطبيق">
              <input
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                placeholder="000000"
                required
              />
            </SecurityField>
            <Feedback error={error} notice={notice} />
            <div className="flex gap-2">
              <Button type="submit" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? "جاري التأكيد..." : "تأكيد التفعيل"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSetup(null);
                  setError(null);
                }}
              >
                إلغاء
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setupMutation.mutate();
            }}
          >
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[8px] leading-5 text-amber-800">
              {security.two_factor.required
                ? "التفعيل مطلوب لهذا الدور قبل استخدام باقي النظام."
                : "ننصح بتفعيله لحماية حسابك حتى إذا تسربت كلمة المرور."}
            </div>
            <SecurityField label="أكد كلمة المرور الحالية">
              <input
                dir="ltr"
                type="password"
                autoComplete="current-password"
                value={setupPassword}
                onChange={(event) => setSetupPassword(event.target.value)}
                required
              />
            </SecurityField>
            <Feedback error={error} notice={notice} />
            <Button type="submit" disabled={setupMutation.isPending}>
              {setupMutation.isPending
                ? "جاري تجهيز المفتاح..."
                : "بدء التفعيل الآمن"}
            </Button>
          </form>
        )
      ) : null}

      {security.two_factor.enabled && !recoveryCodes ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4">
            <div>
              <p className="text-[10px] font-bold text-emerald-800">مفعّل</p>
              <p className="mt-1 text-[8px] text-emerald-700">
                {security.two_factor.recovery_codes_remaining} رموز استرداد
                متبقية
              </p>
            </div>
            <BadgeCheck className="text-emerald-600" size={22} />
          </div>

          {action ? (
            <form
              className="mt-4 space-y-4 rounded-xl border border-navy/[0.07] p-4"
              onSubmit={(event) => {
                event.preventDefault();

                if (action === "codes") codesMutation.mutate();
                else disableMutation.mutate();
              }}
            >
              <p className="text-[9px] font-semibold text-navy">
                {action === "codes"
                  ? "إنشاء رموز استرداد جديدة"
                  : "إيقاف التحقق بخطوتين"}
              </p>
              <SecurityField label="كلمة المرور الحالية">
                <input
                  dir="ltr"
                  type="password"
                  value={actionForm.current_password}
                  onChange={(event) =>
                    setActionForm({
                      ...actionForm,
                      current_password: event.target.value,
                    })
                  }
                  required
                />
              </SecurityField>
              <SecurityField label="رمز التحقق أو الاسترداد">
                <input
                  dir="ltr"
                  value={actionForm.code}
                  onChange={(event) =>
                    setActionForm({ ...actionForm, code: event.target.value })
                  }
                  required
                />
              </SecurityField>
              <Feedback error={error} notice={notice} />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant={action === "disable" ? "danger" : "primary"}
                  disabled={codesMutation.isPending || disableMutation.isPending}
                >
                  تأكيد
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setAction(null);
                    setError(null);
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setAction("codes")}>
                <KeyRound size={14} />
                رموز استرداد جديدة
              </Button>
              {!security.two_factor.required ? (
                <Button variant="danger" onClick={() => setAction("disable")}>
                  إيقاف التحقق
                </Button>
              ) : null}
            </div>
          )}
          <Feedback error={error} notice={notice} />
        </div>
      ) : null}
    </SecurityCard>
  );
}

function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-[10px] font-bold text-amber-900">
        احفظ رموز الاسترداد الآن
      </p>
      <p className="mt-1 text-[8px] leading-5 text-amber-800">
        تظهر هذه الرموز مرة واحدة فقط. كل رمز يُستخدم مرة واحدة عند فقدان
        تطبيق المصادقة.
      </p>
      <div
        dir="ltr"
        className="mt-3 grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-2"
      >
        {codes.map((code) => (
          <code key={code} className="font-mono text-[10px] text-navy">
            {code}
          </code>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton value={codes.join("\n")} label="نسخ كل الرموز" />
        <Button size="sm" onClick={onDone}>
          حفظتها في مكان آمن
        </Button>
      </div>
    </div>
  );
}

function SessionsPanel({ sessions }: { sessions: SecuritySession[] }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiClient(`/api/v1/me/security/sessions/${sessionId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["account-security"] });
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const revokeOthersMutation = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/me/security/sessions/others", {
        method: "DELETE",
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["account-security"] });
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_10px_34px_rgba(11,36,84,.04)]">
      <div className="flex flex-col gap-3 border-b border-navy/[0.055] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">الأجهزة والجلسات</h2>
          <p className="mt-1 text-[9px] text-slate">
            أغلق أي جهاز لا تعرفه أو لم تعد تستخدمه.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => revokeOthersMutation.mutate()}
          disabled={
            sessions.every((session) => session.current) ||
            revokeOthersMutation.isPending
          }
        >
          <LogOut size={14} />
          إغلاق كل الجلسات الأخرى
        </Button>
      </div>
      {error ? (
        <div className="mx-5 mt-4 rounded-xl bg-rose-50 p-3 text-[9px] text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="divide-y divide-navy/[0.05]">
        {sessions.map((session) => (
          <article
            key={session.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-teal">
              {session.device.includes("هاتف") ? (
                <Smartphone size={18} />
              ) : (
                <Laptop size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold text-ink">
                  {session.device}
                </p>
                {session.current ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[7px] font-bold text-emerald-700">
                    الجلسة الحالية
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[8px] text-slate">
                {session.ip_address ?? "IP غير متاح"} ·{" "}
                {relativeTime(session.last_active_at)}
              </p>
              <p className="mt-1 text-[7px] text-slate/60">
                {formatDateTime(session.last_active_at)}
              </p>
            </div>
            {!session.current ? (
              <Button
                size="sm"
                variant="danger"
                onClick={() => revokeMutation.mutate(session.id)}
                disabled={revokeMutation.isPending}
              >
                إغلاق الجلسة
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function SecurityCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_10px_34px_rgba(11,36,84,.04)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-teal">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-navy">{title}</h2>
          <p className="mt-1 text-[8px] leading-5 text-slate">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SecurityMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-navy/[0.065] bg-white p-4">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[8px] text-slate">{label}</p>
        <p className="mt-1 text-[11px] font-bold text-navy">{value}</p>
      </div>
    </article>
  );
}

function SecurityField({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <label>
      <span className="mb-2 block text-[9px] font-semibold text-navy">
        {label}
      </span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[10px] [&>input]:outline-none">
        {children}
      </span>
    </label>
  );
}

function CopyButton({
  value,
  label = "نسخ",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={copy}>
      <Clipboard size={13} />
      {copied ? "تم النسخ" : label}
    </Button>
  );
}

function Feedback({
  error,
  notice,
}: {
  error: string | null;
  notice: string | null;
}) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[9px] text-rose-700">
        {error}
      </p>
    );
  }

  if (notice) {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-[9px] text-emerald-700">
        {notice}
      </p>
    );
  }

  return null;
}

function SecuritySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-2xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-[430px] rounded-2xl bg-white" />
        <div className="h-[430px] rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function errorMessage(value: unknown) {
  if (value instanceof ApiError) {
    return Object.values(value.errors).flat()[0] ?? value.message;
  }

  return "تعذر تنفيذ الإجراء. حاول مرة أخرى.";
}
