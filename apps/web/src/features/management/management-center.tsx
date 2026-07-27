"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatDateTime, relativeTime } from "@/lib/format";
import type {
  AcademySettings,
  ApiItem,
  AuditLog,
  ManagementData,
  RoleDefinition,
  TeamMember,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  Building2,
  CircleAlert,
  Clock3,
  FileClock,
  Fingerprint,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type ReactElement, type ReactNode } from "react";

type View = "organization" | "team" | "roles" | "audit";
type TeamDialog =
  | { type: "create" }
  | { type: "edit"; member: TeamMember }
  | { type: "password"; member: TeamMember }
  | null;

const roleLabels: Record<string, string> = {
  owner: "مدير الأكاديمية",
  staff: "فريق الإدارة",
  admissions: "مسؤول القبول",
  academic_manager: "المدير الأكاديمي",
  accountant: "مسؤول الحسابات",
  teacher: "معلم",
  guardian: "ولي أمر",
};
const categoryLabels: Record<string, string> = {
  settings: "الإعدادات",
  security: "الأمان",
  finance: "المالية",
  admissions: "القبول",
  crm: "العملاء",
  academics: "الأكاديمي",
  operations: "التشغيل",
};
const fieldLabels: Record<string, string> = {
  name: "الاسم",
  email: "البريد",
  phone: "الهاتف",
  job_title: "المسمى",
  role: "الدور",
  status: "الحالة",
  password: "كلمة المرور",
  academy_name: "اسم الأكاديمية",
  timezone: "المنطقة الزمنية",
  currency: "العملة",
  seat_hold_hours: "مدة حجز المقعد",
  offer_validity_days: "صلاحية العرض",
};
const dayLabels: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

export function ManagementCenter() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>("organization");
  const [teamDialog, setTeamDialog] = useState<TeamDialog>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["management"],
    queryFn: () => apiClient<ApiItem<ManagementData>>("/api/v1/management"),
  });

  async function refreshManagement() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["management"] }),
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] }),
    ]);
  }

  if (query.isLoading) return <ManagementSkeleton />;

  if (query.isError || !query.data) {
    return (
      <div className="grid min-h-96 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">تعذر تحميل مركز الإدارة</h1>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const data = query.data.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACADEMY CONTROL CENTER"
        title="إدارة الأكاديمية"
        description="هوية الأكاديمية، قواعد التشغيل، أعضاء الفريق، خريطة الصلاحيات، وسجل كامل لكل تغيير حساس."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث البيانات
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} label="حسابات نشطة" value={data.summary.active_users} hint={`${data.summary.staff_accounts} حسابات فريق`} tone="bg-mist text-teal" />
        <MetricCard icon={UserCog} label="حسابات البوابات" value={data.summary.portal_accounts} hint="معلمون وأولياء أمور" tone="bg-violet-50 text-violet-700" />
        <MetricCard icon={ShieldCheck} label="حسابات موقوفة" value={data.summary.suspended_users} hint="لا يمكنها تسجيل الدخول" tone="bg-rose-50 text-rose-700" />
        <MetricCard icon={Activity} label="تغييرات اليوم" value={data.summary.audit_today} hint="أحداث مسجلة تلقائيًا" tone="bg-amber-50 text-amber-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_10px_34px_rgba(11,36,84,.045)]">
        <div className="thin-scrollbar flex gap-1 overflow-x-auto border-b border-navy/[0.055] bg-cloud/45 p-2">
          <ViewButton icon={Building2} active={activeView === "organization"} onClick={() => setActiveView("organization")}>تشغيل الأكاديمية</ViewButton>
          <ViewButton icon={UsersRound} active={activeView === "team"} onClick={() => setActiveView("team")}>الفريق والحسابات</ViewButton>
          <ViewButton icon={ShieldCheck} active={activeView === "roles"} onClick={() => setActiveView("roles")}>الأدوار والصلاحيات</ViewButton>
          <ViewButton icon={FileClock} active={activeView === "audit"} onClick={() => setActiveView("audit")}>سجل التدقيق</ViewButton>
        </div>

        {activeView === "organization" ? (
          <OrganizationPanel settings={data.settings} onSuccess={refreshManagement} />
        ) : null}
        {activeView === "team" ? (
          <TeamPanel
            team={data.team}
            currentUserId={user?.id ?? ""}
            onDialog={setTeamDialog}
          />
        ) : null}
        {activeView === "roles" ? <RolesPanel roles={data.roles} team={data.team} /> : null}
        {activeView === "audit" ? <AuditPanel items={data.audit_logs} /> : null}
      </section>

      <CreateMemberDialog
        open={teamDialog?.type === "create"}
        roles={data.roles}
        onClose={() => setTeamDialog(null)}
        onSuccess={refreshManagement}
      />
      {teamDialog?.type === "edit" ? (
        <EditMemberDialog
          open
          member={teamDialog.member}
          roles={data.roles}
          currentUserId={user?.id ?? ""}
          onClose={() => setTeamDialog(null)}
          onSuccess={refreshManagement}
        />
      ) : null}
      {teamDialog?.type === "password" ? (
        <PasswordDialog
          open
          member={teamDialog.member}
          onClose={() => setTeamDialog(null)}
          onSuccess={refreshManagement}
        />
      ) : null}
    </div>
  );
}

function OrganizationPanel({
  settings,
  onSuccess,
}: {
  settings: AcademySettings;
  onSuccess: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    academy_name: settings.academy_name,
    academy_name_en: settings.academy_name_en ?? "",
    phone: settings.phone ?? "",
    whatsapp_phone: settings.whatsapp_phone ?? "",
    email: settings.email ?? "",
    website: settings.website ?? "",
    address: settings.address ?? "",
    timezone: settings.timezone,
    locale: settings.locale,
    currency: settings.currency,
    invoice_prefix: settings.invoice_prefix,
    student_code_prefix: settings.student_code_prefix,
    offer_validity_days: settings.offer_validity_days,
    seat_hold_hours: settings.seat_hold_hours,
    working_days: settings.working_days,
    business_hours: settings.business_hours,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<AcademySettings>>("/api/v1/management/settings", {
        method: "PATCH",
        json: {
          ...form,
          academy_name_en: form.academy_name_en || null,
          phone: form.phone || null,
          whatsapp_phone: form.whatsapp_phone || null,
          email: form.email || null,
          website: form.website || null,
          address: form.address || null,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      setNotice("تم حفظ إعدادات الأكاديمية وتسجيل التغيير.");
    },
    onError: (value) => {
      setNotice(null);
      setError(errorMessage(value));
    },
  });

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="p-5 lg:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-6 2xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-6">
          <SettingsSection icon={Building2} title="هوية الأكاديمية" description="البيانات التي يعتمد عليها الفريق في التواصل والمستندات.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="اسم الأكاديمية بالعربية">
                <input value={form.academy_name} onChange={(event) => updateField("academy_name", event.target.value)} required />
              </Field>
              <Field label="الاسم بالإنجليزية">
                <input dir="ltr" value={form.academy_name_en} onChange={(event) => updateField("academy_name_en", event.target.value)} />
              </Field>
              <Field label="البريد الرسمي">
                <input dir="ltr" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </Field>
              <Field label="الموقع الإلكتروني">
                <input dir="ltr" type="url" value={form.website} onChange={(event) => updateField("website", event.target.value)} />
              </Field>
              <Field label="رقم الهاتف">
                <input dir="ltr" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </Field>
              <Field label="رقم WhatsApp">
                <input dir="ltr" value={form.whatsapp_phone} onChange={(event) => updateField("whatsapp_phone", event.target.value)} />
              </Field>
            </div>
            <Field label="العنوان">
              <textarea rows={3} value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>
          </SettingsSection>

          <SettingsSection icon={Clock3} title="أيام وساعات العمل" description="تستخدم كمرجع للتشغيل والمواعيد الافتراضية.">
            <div className="flex flex-wrap gap-2">
              {Object.entries(dayLabels).map(([value, label]) => {
                const selected = form.working_days.includes(value);

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      updateField(
                        "working_days",
                        selected
                          ? form.working_days.filter((day) => day !== value)
                          : [...form.working_days, value],
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                      selected ? "bg-navy text-white" : "border border-navy/[0.08] bg-cloud text-slate"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="بداية يوم العمل">
                <input
                  type="time"
                  value={form.business_hours.start}
                  onChange={(event) =>
                    updateField("business_hours", {
                      ...form.business_hours,
                      start: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="نهاية يوم العمل">
                <input
                  type="time"
                  value={form.business_hours.end}
                  onChange={(event) =>
                    updateField("business_hours", {
                      ...form.business_hours,
                      end: event.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </SettingsSection>
        </div>

        <div className="space-y-6">
          <SettingsSection icon={Settings2} title="قواعد التشغيل الافتراضية" description="قيم جاهزة تقلل الإدخال اليدوي وتحافظ على اتساق الفريق.">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <Field label="صلاحية عرض التسجيل بالأيام">
                <input type="number" min="1" max="90" value={form.offer_validity_days} onChange={(event) => updateField("offer_validity_days", Number(event.target.value))} />
              </Field>
              <Field label="مدة حجز المقعد بالساعات">
                <input type="number" min="1" max="336" value={form.seat_hold_hours} onChange={(event) => updateField("seat_hold_hours", Number(event.target.value))} />
              </Field>
              <Field label="بادئة رقم الفاتورة">
                <input dir="ltr" value={form.invoice_prefix} onChange={(event) => updateField("invoice_prefix", event.target.value.toUpperCase())} />
              </Field>
              <Field label="بادئة كود الطالب">
                <input dir="ltr" value={form.student_code_prefix} onChange={(event) => updateField("student_code_prefix", event.target.value.toUpperCase())} />
              </Field>
              <Field label="العملة الأساسية">
                <select value={form.currency} onChange={(event) => updateField("currency", event.target.value)}>
                  <option value="EGP">الجنيه المصري · EGP</option>
                  <option value="USD">الدولار · USD</option>
                  <option value="SAR">الريال السعودي · SAR</option>
                  <option value="AED">الدرهم الإماراتي · AED</option>
                </select>
              </Field>
              <Field label="المنطقة الزمنية">
                <select value={form.timezone} onChange={(event) => updateField("timezone", event.target.value)}>
                  <option value="Africa/Cairo">القاهرة · Africa/Cairo</option>
                  <option value="Asia/Riyadh">الرياض · Asia/Riyadh</option>
                  <option value="Asia/Dubai">دبي · Asia/Dubai</option>
                </select>
              </Field>
            </div>
          </SettingsSection>

          <div className="rounded-2xl bg-navy p-5 text-white">
            <div className="flex items-start gap-3">
              <Fingerprint className="mt-0.5 shrink-0 text-sun" size={19} />
              <div>
                <p className="text-[11px] font-semibold">كل تعديل موثق</p>
                <p className="mt-1 text-[8px] leading-5 text-white/50">
                  آخر تحديث بواسطة {settings.updater?.name ?? "النظام"} في {formatDateTime(settings.updated_at)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {notice ? <Feedback tone="success">{notice}</Feedback> : null}
      <div className="mt-6 flex justify-end border-t border-navy/[0.055] pt-5">
        <Button type="submit" disabled={mutation.isPending}>
          <BadgeCheck size={15} className="text-sun" />
          {mutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}

function TeamPanel({
  team,
  currentUserId,
  onDialog,
}: {
  team: TeamMember[];
  currentUserId: string;
  onDialog: (dialog: TeamDialog) => void;
}) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "staff" | "portal" | "suspended">("all");
  const term = search.trim().toLowerCase();
  const filtered = team.filter((member) => {
    const matchesSearch =
      !term ||
      member.name.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      member.job_title?.toLowerCase().includes(term);
    const matchesScope =
      scope === "all" ||
      (scope === "suspended" ? member.status === "suspended" : member.account_type === scope);

    return matchesSearch && matchesScope;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-navy/[0.055] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">أعضاء الفريق والحسابات</h2>
          <p className="mt-1 text-[9px] text-slate">إدارة الوصول دون حذف السجل التاريخي لأي مستخدم.</p>
        </div>
        <Button onClick={() => onDialog({ type: "create" })}>
          <Plus size={15} className="text-sun" />
          إضافة عضو فريق
        </Button>
      </div>
      <div className="flex flex-col gap-3 border-b border-navy/[0.055] bg-cloud/35 p-4 lg:flex-row">
        <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-navy/[0.08] bg-white px-3">
          <Search size={15} className="text-slate" />
          <span className="sr-only">بحث في الفريق</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" placeholder="الاسم، البريد، أو المسمى الوظيفي..." />
        </label>
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1">
          {([
            ["all", "الكل"],
            ["staff", "فريق الإدارة"],
            ["portal", "حسابات البوابات"],
            ["suspended", "موقوفة"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setScope(value)} className={`rounded-lg px-3 py-2 text-[8px] font-semibold ${scope === value ? "bg-navy text-white" : "text-slate"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-cloud/45 text-right text-[8px] font-semibold text-slate">
              <th className="px-5 py-3">المستخدم</th>
              <th className="px-4 py-3">الدور</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">آخر دخول</th>
              <th className="px-4 py-3">النشاط</th>
              <th className="px-5 py-3 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.05]">
            {filtered.map((member) => (
              <tr key={member.id} className="transition hover:bg-cloud/45">
                <td className="px-5 py-4"><MemberIdentity member={member} current={member.id === currentUserId} /></td>
                <td className="px-4 py-4">
                  <p className="text-[9px] font-semibold text-navy">{roleLabels[member.role] ?? member.role}</p>
                  <p className="mt-1 text-[8px] text-slate">{member.account_type === "portal" ? "حساب بوابة" : "حساب فريق"}</p>
                </td>
                <td className="px-4 py-4"><StatusBadge value={member.status} label={member.status === "active" ? "نشط" : "موقوف"} /></td>
                <td className="px-4 py-4 text-[8px] text-slate">{member.last_login_at ? relativeTime(member.last_login_at) : "لم يسجل الدخول"}</td>
                <td className="px-4 py-4 text-[8px] text-slate">{member.audit_events_count} تغييرات</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {member.id !== currentUserId ? (
                      <Button size="icon" variant="ghost" aria-label={`تغيير كلمة مرور ${member.name}`} onClick={() => onDialog({ type: "password", member })}>
                        <KeyRound size={14} />
                      </Button>
                    ) : null}
                    <Button size="icon" variant="secondary" aria-label={`تعديل ${member.name}`} onClick={() => onDialog({ type: "edit", member })}>
                      <Pencil size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-navy/[0.05] lg:hidden">
        {filtered.map((member) => (
          <article key={member.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <MemberIdentity member={member} current={member.id === currentUserId} />
              <StatusBadge value={member.status} label={member.status === "active" ? "نشط" : "موقوف"} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-cloud p-3">
              <span className="text-[8px] text-slate">{roleLabels[member.role]}</span>
              <Button size="sm" variant="secondary" onClick={() => onDialog({ type: "edit", member })}>إدارة الحساب</Button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? <EmptyState icon={UsersRound} text="لا توجد حسابات مطابقة." /> : null}
    </div>
  );
}

function RolesPanel({ roles, team }: { roles: RoleDefinition[]; team: TeamMember[] }) {
  return (
    <div className="p-5 lg:p-6">
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-mist/60 p-4">
        <ShieldCheck className="shrink-0 text-teal" size={20} />
        <div>
          <h2 className="text-[11px] font-bold text-navy">الصلاحيات تُفرض من الـAPI</h2>
          <p className="mt-1 text-[8px] leading-5 text-slate">إخفاء زر في الواجهة ليس حماية؛ كل مسار في Laravel يتحقق من الدور قبل تنفيذ الإجراء.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const members = team.filter((member) => member.role === role.key).length;

          return (
            <article key={role.key} className={`rounded-2xl border p-5 ${role.key === "owner" ? "border-sun/40 bg-navy text-white shadow-[0_16px_38px_rgba(11,36,84,.14)]" : "border-navy/[0.065] bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`grid size-10 place-items-center rounded-xl ${role.key === "owner" ? "bg-white/10 text-sun" : "bg-cloud text-teal"}`}>
                  <ShieldCheck size={18} />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${role.key === "owner" ? "bg-white/10 text-white/65" : "bg-cloud text-slate"}`}>{members} حساب</span>
              </div>
              <h3 className={`mt-4 text-sm font-bold ${role.key === "owner" ? "text-white" : "text-navy"}`}>{role.label}</h3>
              <p className={`mt-2 min-h-10 text-[8px] leading-5 ${role.key === "owner" ? "text-white/50" : "text-slate"}`}>{role.description}</p>
              <div className={`mt-4 border-t pt-4 ${role.key === "owner" ? "border-white/10" : "border-navy/[0.055]"}`}>
                <p className={`text-[8px] font-semibold ${role.key === "owner" ? "text-white/40" : "text-slate"}`}>أهم الصلاحيات</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.permissions.map((permission) => (
                    <span key={permission} className={`rounded-lg px-2 py-1.5 text-[8px] ${role.key === "owner" ? "bg-white/[0.07] text-white/75" : "bg-cloud text-navy"}`}>{permission}</span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AuditPanel({ items }: { items: AuditLog[] }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesSearch =
      !term ||
      item.description.toLowerCase().includes(term) ||
      item.actor?.name.toLowerCase().includes(term) ||
      item.action.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-navy/[0.055] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">سجل التدقيق والأمان</h2>
          <p className="mt-1 text-[9px] text-slate">آخر 100 عملية تغيير ناجحة، مع رقم الطلب للرجوع للسجلات التقنية.</p>
        </div>
        <label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-navy/[0.08] bg-cloud px-3 lg:max-w-xs">
          <Search size={15} className="text-slate" />
          <span className="sr-only">بحث في سجل التدقيق</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" placeholder="المنفذ أو وصف العملية..." />
        </label>
      </div>
      <div className="thin-scrollbar flex gap-2 overflow-x-auto border-b border-navy/[0.055] bg-cloud/35 p-4">
        <button type="button" onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-3 py-2 text-[8px] font-semibold ${category === "all" ? "bg-navy text-white" : "bg-white text-slate"}`}>كل الأحداث</button>
        {Object.entries(categoryLabels).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setCategory(value)} className={`shrink-0 rounded-full px-3 py-2 text-[8px] font-semibold ${category === value ? "bg-navy text-white" : "bg-white text-slate"}`}>{label}</button>
        ))}
      </div>
      {filtered.length ? (
        <div className="divide-y divide-navy/[0.05]">
          {filtered.map((item) => (
            <article key={item.id} className="grid gap-4 px-5 py-4 transition hover:bg-cloud/45 xl:grid-cols-[170px_minmax(0,1fr)_170px] xl:items-start">
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-mist text-[10px] font-bold text-navy">{item.actor?.name.charAt(0) ?? "ن"}</div>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold text-ink">{item.actor?.name ?? "النظام"}</p>
                  <p className="mt-1 text-[8px] text-slate">{roleLabels[item.actor?.role ?? ""] ?? "System"}</p>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.category} label={categoryLabels[item.category] ?? item.category} />
                  <span className="font-mono text-[7px] text-slate">{item.action}</span>
                </div>
                <p className="mt-2 text-[10px] font-medium leading-5 text-ink">{item.description}</p>
                {item.changed_fields.length ? (
                  <p className="mt-2 text-[8px] text-slate">
                    الحقول: {item.changed_fields.map((field) => fieldLabels[field] ?? field).join("، ")}
                  </p>
                ) : null}
              </div>
              <div className="xl:text-left">
                <p className="text-[8px] font-medium text-slate">{formatDateTime(item.created_at)}</p>
                <p className="mt-1 font-mono text-[7px] text-slate/60">{item.request_id ?? "بدون رقم طلب"}</p>
                <p className="mt-1 text-[7px] text-slate/60">{item.ip_address}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileClock} text="لا توجد أحداث مطابقة." />
      )}
    </div>
  );
}

function CreateMemberDialog({
  open,
  roles,
  onClose,
  onSuccess,
}: {
  open: boolean;
  roles: RoleDefinition[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    job_title: "",
    role: "admissions",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/management/team", {
        method: "POST",
        json: {
          ...form,
          phone: form.phone || null,
          job_title: form.job_title || null,
          status: "active",
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const staffRoles = roles.filter((role) => !["teacher", "guardian"].includes(role.key));

  return (
    <ActionDialog open={open} onClose={onClose} title="إضافة عضو فريق" description="أنشئ حسابًا إداريًا وحدد دوره بدقة. يمكن إيقاف الحساب لاحقًا دون حذف تاريخه.">
      <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
          <Field label="المسمى الوظيفي"><input value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} /></Field>
          <Field label="البريد الإلكتروني"><input dir="ltr" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
          <Field label="رقم الهاتف"><input dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        </div>
        <Field label="الدور والصلاحيات">
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {staffRoles.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="كلمة المرور المؤقتة"><input dir="ltr" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></Field>
          <Field label="تأكيد كلمة المرور"><input dir="ltr" type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} required /></Field>
        </div>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[8px] leading-5 text-amber-800">10 أحرف على الأقل، مع حرف كبير وصغير ورقم. لا تظهر كلمة المرور في سجل التدقيق.</p>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="إنشاء الحساب" />
      </form>
    </ActionDialog>
  );
}

function EditMemberDialog({
  open,
  member,
  roles,
  currentUserId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  member: TeamMember;
  roles: RoleDefinition[];
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    phone: member.phone ?? "",
    job_title: member.job_title ?? "",
    role: member.role,
    status: member.status,
  });
  const [error, setError] = useState<string | null>(null);
  const self = member.id === currentUserId;
  const portal = member.account_type === "portal";
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/management/team/${member.id}`, {
        method: "PATCH",
        json: {
          ...form,
          phone: form.phone || null,
          job_title: form.job_title || null,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const staffRoles = roles.filter((role) => !["teacher", "guardian"].includes(role.key));

  return (
    <ActionDialog open={open} onClose={onClose} title={`إدارة حساب ${member.name}`} description={self ? "يمكنك تعديل بياناتك، بينما يحمي النظام دور حسابك الحالي وحالته." : "حدّث البيانات أو الدور أو حالة الوصول؛ كل تغيير سيسجل تلقائيًا."}>
      <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
          <Field label="المسمى الوظيفي"><input value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} /></Field>
          <Field label="البريد"><input dir="ltr" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></Field>
          <Field label="الهاتف"><input dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label="الدور">
            <select disabled={self || portal} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {portal ? <option value={member.role}>{roleLabels[member.role]}</option> : staffRoles.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
            </select>
          </Field>
          <Field label="حالة الوصول">
            <select disabled={self} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
            </select>
          </Field>
        </div>
        {portal ? <Feedback tone="info">هذا الحساب مرتبط بملف {member.role === "teacher" ? "معلم" : "ولي أمر"}؛ لذلك لا يمكن تغيير نوع دوره.</Feedback> : null}
        {self ? <Feedback tone="info">لا يمكن تغيير دور حسابك الحالي أو تعطيله من هذه الشاشة.</Feedback> : null}
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ الحساب" />
      </form>
    </ActionDialog>
  );
}

function PasswordDialog({
  open,
  member,
  onClose,
  onSuccess,
}: {
  open: boolean;
  member: TeamMember;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/management/team/${member.id}/password`, {
        method: "POST",
        json: { password, password_confirmation: confirmation },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog open={open} onClose={onClose} title="تعيين كلمة مرور جديدة" description={`سيتم إغلاق كل الجلسات المفتوحة لحساب ${member.name} بعد الحفظ.`}>
      <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <Field label="كلمة المرور الجديدة"><input dir="ltr" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
        <Field label="تأكيد كلمة المرور"><input dir="ltr" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></Field>
        <Feedback tone="info">لن تسجل قيمة كلمة المرور في سجل التدقيق، وسيظهر فقط أن الحقل تغيّر.</Feedback>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="تحديث كلمة المرور" />
      </form>
    </ActionDialog>
  );
}

function ActionDialog({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px]" />
        <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] leading-5 text-slate">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button size="icon" variant="secondary" aria-label="إغلاق"><X size={16} /></Button></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogActions({ error, pending, submitLabel }: { error: string | null; pending: boolean; submitLabel: string }) {
  return (
    <>
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Dialog.Close asChild><Button variant="secondary">إلغاء</Button></Dialog.Close>
        <Button type="submit" disabled={pending}>{pending ? "جاري الحفظ..." : submitLabel}</Button>
      </div>
    </>
  );
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy/[0.065] bg-white p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-teal"><Icon size={18} /></div>
        <div><h2 className="text-[12px] font-bold text-navy">{title}</h2><p className="mt-1 text-[8px] leading-5 text-slate">{description}</p></div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactElement }) {
  return (
    <label>
      <span className="mb-2 block text-[9px] font-semibold text-navy">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[10px] [&>input]:outline-none [&>input:disabled]:opacity-55 [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[10px] [&>select]:outline-none [&>select:disabled]:opacity-55 [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:p-3.5 [&>textarea]:text-[10px] [&>textarea]:outline-none">{children}</span>
    </label>
  );
}

function MemberIdentity({ member, current }: { member: TeamMember; current: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${current ? "bg-navy text-sun" : "bg-mist text-navy"}`}>{member.name.charAt(0)}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2"><p className="truncate text-[10px] font-semibold text-ink">{member.name}</p>{current ? <span className="rounded bg-sun/20 px-1.5 py-0.5 text-[7px] font-bold text-amber-800">أنت</span> : null}</div>
        <p className="mt-1 truncate text-[8px] text-slate">{member.job_title ?? member.email}</p>
      </div>
    </div>
  );
}

function ViewButton({ icon: Icon, active, onClick, children }: { icon: LucideIcon; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[9px] font-semibold transition ${active ? "bg-white text-navy shadow-sm" : "text-slate hover:text-navy"}`}>
      <Icon size={14} className={active ? "text-teal" : ""} />{children}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: number; hint: string; tone: string }) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-2xl font-bold text-navy">{value}</p><p className="mt-1 text-[9px] font-medium text-slate">{label}</p><p className="mt-2 text-[8px] text-slate/70">{hint}</p></div>
        <div className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={18} /></div>
      </div>
    </article>
  );
}

function Feedback({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = { error: "bg-rose-50 text-rose-700", success: "bg-emerald-50 text-emerald-700", info: "bg-sky-50 text-sky-700" };
  return <p role={tone === "error" ? "alert" : undefined} className={`mt-4 rounded-xl px-3 py-2.5 text-[9px] leading-5 ${styles[tone]}`}>{children}</p>;
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return <div className="grid min-h-48 place-items-center p-8 text-center"><div><Icon className="mx-auto text-teal" size={26} /><p className="mt-3 text-[10px] font-semibold text-navy">{text}</p></div></div>;
}

function ManagementSkeleton() {
  return <div className="animate-pulse space-y-6"><div className="h-20 rounded-2xl bg-white" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-white" />)}</div><div className="h-[620px] rounded-2xl bg-white" /></div>;
}

function errorMessage(value: unknown) {
  if (value instanceof ApiError) return Object.values(value.errors).flat()[0] ?? value.message;
  return "تعذر حفظ التغييرات. حاول مرة أخرى.";
}
