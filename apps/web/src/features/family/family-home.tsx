"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { ApiItem, FamilyChild, FamilyHomeData, Message } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageCircleMore,
  LifeBuoy,
  Plus,
  RefreshCw,
  School,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type FormEvent } from "react";

const invoiceLabels: Record<string, string> = {
  draft: "مسودة",
  issued: "مستحقة",
  partially_paid: "مدفوعة جزئيًا",
  paid: "مدفوعة",
  overdue: "متأخرة",
  cancelled: "ملغاة",
};

const ratingLabels: Record<string, string> = {
  needs_improvement: "يحتاج دعمًا",
  developing: "يتطور",
  good: "جيد",
  excellent: "ممتاز",
};

const channelLabels: Record<string, string> = {
  internal: "رسالة الأكاديمية",
  whatsapp: "WhatsApp",
  email: "البريد الإلكتروني",
  sms: "SMS",
};

export function FamilyHome() {
  const [selectedChildId, setSelectedChildId] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["family", "home"],
    queryFn: () => apiClient<ApiItem<FamilyHomeData>>("/api/v1/family/home"),
  });
  const data = query.data?.data;
  const activeChild =
    data?.children.find((child) => child.id === selectedChildId) ?? data?.children[0];

  if (query.isLoading) return <FamilySkeleton />;

  if (query.isError || !data) {
    return (
      <section className="grid min-h-[65vh] place-items-center rounded-3xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">تعذر تحميل متابعة الأبناء</h1>
          <Button className="mt-4" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-navy p-6 text-white shadow-[0_22px_70px_rgba(11,36,84,.2)] sm:p-8">
        <div className="absolute -left-14 -top-20 size-56 rounded-full bg-teal/20 blur-2xl" />
        <div className="absolute -bottom-24 right-1/3 size-48 rounded-full bg-sun/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-teal-bright">
              <Sparkles size={14} />
              Family Portal · متابعة واضحة بلا تعقيد
            </div>
            <h1 className="mt-4 text-2xl font-bold sm:text-[30px]">
              أهلًا {data.guardian.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/60">
              الحصص والحضور والتقدم والفواتير ورسائل الأكاديمية في مكان واحد.
            </p>
          </div>
          <Button
            variant="secondary"
            className="border-white/10 bg-white/10 text-white hover:bg-white/15"
            onClick={() => query.refetch()}
          >
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث البيانات
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FamilyMetric
          icon={GraduationCap}
          label="الأبناء المسجلون"
          value={data.summary.children}
          hint="داخل حساب الأسرة"
          tone="bg-sky-50 text-sky-700"
        />
        <FamilyMetric
          icon={CircleDollarSign}
          label="الرصيد المستحق"
          value={formatCurrency(data.summary.outstanding_balance)}
          hint="إجمالي الفواتير المفتوحة"
          tone="bg-amber-50 text-amber-700"
        />
        <FamilyMetric
          icon={MessageCircleMore}
          label="رسائل جديدة"
          value={data.summary.unread_messages}
          hint="من فريق الأكاديمية"
          tone="bg-teal/10 text-teal"
        />
        <FamilyMetric
          icon={LifeBuoy}
          label="طلبات مفتوحة"
          value={data.summary.open_requests}
          hint="يعمل عليها فريق الأكاديمية"
          tone="bg-violet-50 text-violet-700"
        />
      </section>

      {data.children.length > 1 ? (
        <section className="rounded-2xl border border-navy/[0.065] bg-white p-3">
          <p className="px-2 pb-2 text-[11px] font-semibold text-slate">اختر الطالب</p>
          <div className="flex gap-2 overflow-x-auto">
            {data.children.map((child) => {
              const active = activeChild?.id === child.id;

              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex min-w-[190px] items-center gap-3 rounded-2xl p-3 text-right transition ${
                    active ? "bg-navy text-white" : "bg-cloud text-navy hover:bg-mist"
                  }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-xl text-sm font-bold ${
                      active ? "bg-teal text-navy" : "bg-white text-teal"
                    }`}
                  >
                    {child.full_name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-[12px] font-bold">{child.full_name}</span>
                    <span className={`mt-1 block text-[11px] ${active ? "text-white/50" : "text-slate"}`}>
                      {child.student_code}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {activeChild ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
            <ChildOverview child={activeChild} />
            <NextSessionCard child={activeChild} />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <div className="space-y-6">
              <PublishedReportsPanel child={activeChild} />
              <ProgressPanel child={activeChild} />
              <InvoicesPanel child={activeChild} />
            </div>
            <div className="space-y-6">
              <ServiceRequestsPanel
                child={activeChild}
                requests={data.service_requests.filter(
                  (request) => !request.student || request.student.id === activeChild.id,
                )}
                onCreate={() => setRequestOpen(true)}
              />
              <MessagesPanel
                messages={data.messages.filter(
                  (message) => !message.student || message.student.id === activeChild.id,
                )}
              />
            </div>
          </div>
        </>
      ) : (
        <section className="rounded-3xl border border-dashed border-navy/10 bg-white p-12 text-center">
          <UsersRound className="mx-auto text-teal" size={30} />
          <p className="mt-4 text-xs font-bold text-navy">
            لا يوجد طلاب مرتبطون بهذا الحساب بعد
          </p>
        </section>
      )}

      <FamilyRequestDialog
        child={activeChild ?? null}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onCreated={() => {
          setRequestOpen(false);
          queryClient.invalidateQueries({ queryKey: ["family", "home"] });
        }}
      />
    </div>
  );
}

function PublishedReportsPanel({ child }: { child: FamilyChild }) {
  return (
    <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">تقارير التقدم الدورية</h2>
          <p className="mt-1 text-[12px] text-slate">التقارير التي نشرها الفريق الأكاديمي</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-700">
          <FileText size={18} />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {child.published_reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-navy/[0.055] bg-gradient-to-br from-white to-cloud/65 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-navy">{report.period_label}</p>
                <p className="mt-1 text-[11px] text-slate">
                  {formatDate(report.period_starts_on)} — {formatDate(report.period_ends_on)}
                </p>
              </div>
              <StatusBadge
                value={report.overall_rating}
                label={ratingLabels[report.overall_rating] ?? report.overall_rating}
              />
            </div>
            <p className="mt-4 text-[12px] leading-6 text-slate">{report.summary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <ReportDetail label="نقاط القوة" value={report.strengths} tone="bg-emerald-50 text-emerald-900/75" />
              <ReportDetail label="نقاط التحسين" value={report.areas_for_improvement} tone="bg-amber-50 text-amber-900/75" />
              <ReportDetail label="الخطوات القادمة" value={report.next_steps} tone="bg-sky-50 text-sky-900/75" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate">
              {report.overall_score ? <span>الدرجة {Number(report.overall_score)}%</span> : null}
              {report.attendance_rate ? <span>الحضور {Number(report.attendance_rate)}%</span> : null}
              {report.publisher ? <span>اعتماد {report.publisher.name}</span> : null}
            </div>
          </article>
        ))}
        {!child.published_reports.length ? (
          <p className="py-8 text-center text-[12px] text-slate">لا توجد تقارير منشورة بعد.</p>
        ) : null}
      </div>
    </section>
  );
}

function ReportDetail({ label, value, tone }: { label: string; value: string | null; tone: string }) {
  return (
    <div className={`rounded-xl p-3 ${tone}`}>
      <p className="text-[11px] font-bold">{label}</p>
      <p className="mt-1 line-clamp-3 text-[11px] leading-5">{value ?? "—"}</p>
    </div>
  );
}

function ServiceRequestsPanel({
  child,
  requests,
  onCreate,
}: {
  child: FamilyChild;
  requests: FamilyHomeData["service_requests"];
  onCreate: () => void;
}) {
  return (
    <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-navy">طلبات المساعدة</h2>
          <p className="mt-1 text-[12px] text-slate">تواصل منظم مع فريق الأكاديمية</p>
        </div>
        <Button size="sm" onClick={onCreate}><Plus size={14} />طلب جديد</Button>
      </div>
      <div className="mt-5 space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-navy/[0.055] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-bold text-teal">{request.request_number}</p>
                <p className="mt-2 text-[12px] font-bold text-navy">{request.subject}</p>
                <p className="mt-1 text-[11px] text-slate">{formatDateTime(request.created_at)}</p>
              </div>
              <StatusBadge
                value={request.status}
                label={
                  request.status === "open"
                    ? "وصل للفريق"
                    : request.status === "in_progress"
                      ? "قيد المعالجة"
                      : request.status === "resolved"
                        ? "تم الحل"
                        : "مغلق"
                }
              />
            </div>
            {request.resolution ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-900/75">
                {request.resolution}
              </p>
            ) : null}
          </article>
        ))}
        {!requests.length ? (
          <div className="py-8 text-center">
            <LifeBuoy className="mx-auto text-teal" size={24} />
            <p className="mt-2 text-[12px] text-slate">لا توجد طلبات خاصة بـ{` ${child.full_name}`}.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FamilyRequestDialog({
  child,
  open,
  onClose,
  onCreated,
}: {
  child: FamilyChild | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [category, setCategory] = useState("academic");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/family/service-requests", {
        method: "POST",
        json: {
          student_id: child?.id ?? null,
          category,
          priority,
          subject,
          description,
        },
      }),
    onSuccess: onCreated,
  });

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-[2px]" />
        <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-[540px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">طلب مساعدة جديد</Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] text-slate">
                {child ? `بخصوص ${child.full_name}` : "طلب عام لفريق الأكاديمية"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild><Button size="icon" variant="secondary" aria-label="إغلاق"><X size={16} /></Button></Dialog.Close>
          </div>
          <form className="mt-6 space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); mutation.mutate(); }}>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[12px] font-semibold text-navy">
                نوع الطلب
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-navy/10 bg-white px-3 text-[12px]">
                  <option value="academic">متابعة أكاديمية</option>
                  <option value="schedule">المواعيد والحصص</option>
                  <option value="billing">الحسابات</option>
                  <option value="technical">دعم فني</option>
                  <option value="complaint">شكوى</option>
                  <option value="other">أخرى</option>
                </select>
              </label>
              <label className="text-[12px] font-semibold text-navy">
                الأولوية
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-navy/10 bg-white px-3 text-[12px]">
                  <option value="normal">عادي</option>
                  <option value="high">مهم</option>
                </select>
              </label>
            </div>
            <label className="block text-[12px] font-semibold text-navy">
              عنوان الطلب
              <input required value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-navy/10 px-3 text-[12px] outline-none focus:border-teal/50" />
            </label>
            <label className="block text-[12px] font-semibold text-navy">
              اشرح طلبك
              <textarea required rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="اكتب التفاصيل التي تساعد الفريق على خدمتك بسرعة..." className="mt-2 w-full rounded-xl border border-navy/10 p-3 text-[12px] outline-none focus:border-teal/50" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>إلغاء</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChildOverview({ child }: { child: FamilyChild }) {
  return (
    <article className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-navy text-lg font-bold text-white">
          {child.full_name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-navy">{child.full_name}</h2>
            <StatusBadge value={child.status} label="طالب نشط" />
          </div>
          <p className="mt-1 text-[12px] text-slate">{child.student_code}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Detail icon={School} label="الجروب" value={child.cohort?.name ?? "غير مسجل"} />
        <Detail icon={BookOpenCheck} label="المستوى" value={child.cohort?.level ?? "—"} />
        <Detail icon={UserRoundCheck} label="المعلم" value={child.cohort?.teacher ?? "—"} />
        <Detail
          icon={Video}
          label="نظام الدراسة"
          value={child.cohort?.delivery_mode === "online" ? "Online" : "داخل الأكاديمية"}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-cloud p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate">نسبة الحضور</p>
            <p className="mt-1 text-xl font-bold text-navy">{child.attendance.rate}%</p>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BadgeCheck size={20} />
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/8">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${Math.min(child.attendance.rate, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate">
          {child.attendance.records} سجلات حضور · {child.attendance.absences} غياب
        </p>
      </div>
    </article>
  );
}

function NextSessionCard({ child }: { child: FamilyChild }) {
  const session = child.next_session;

  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-[#078494] p-5 text-navy shadow-[0_18px_50px_rgba(11,167,180,.18)] sm:p-6">
      <div className="absolute -left-12 -bottom-14 size-40 rounded-full bg-white/15" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] font-semibold text-navy/60">الحصة القادمة</p>
            <h2 className="mt-2 text-lg font-bold">
              {session?.title ?? "لا توجد حصة قادمة"}
            </h2>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-white/35">
            <CalendarClock size={21} />
          </span>
        </div>

        {session ? (
          <>
            <p className="mt-5 text-sm font-bold">{formatDateTime(session.starts_at)}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-navy/70">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} />
                {Math.round(
                  (new Date(session.ends_at).getTime() -
                    new Date(session.starts_at).getTime()) /
                    60_000,
                )}{" "}
                دقيقة
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Video size={14} />
                {session.meeting_url ? "Online" : session.room_name}
              </span>
            </div>
            {session.meeting_url ? (
              <a
                href={session.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-[12px] font-semibold text-white"
              >
                فتح رابط الحصة
                <ExternalLink size={14} />
              </a>
            ) : (
              <p className="mt-8 rounded-xl bg-white/25 p-3 text-[12px] font-semibold">
                المكان: {session.room_name}
              </p>
            )}
          </>
        ) : (
          <p className="mt-5 text-[12px] leading-6 text-navy/65">
            سيظهر الموعد هنا فور إضافته من فريق الأكاديمية.
          </p>
        )}
      </div>
    </article>
  );
}

function ProgressPanel({ child }: { child: FamilyChild }) {
  return (
    <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">آخر تقييمات التقدم</h2>
          <p className="mt-1 text-[12px] text-slate">ملاحظات المعلم والتقييمات الأكاديمية</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-700">
          <BookOpenCheck size={18} />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {child.latest_progress.map((progress) => (
          <article key={progress.id} className="rounded-2xl border border-navy/[0.055] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-navy">{progress.title}</p>
                <p className="mt-1 text-[11px] text-slate">
                  {formatDate(progress.occurred_on)} · {progress.evaluator}
                </p>
              </div>
              <StatusBadge
                value={progress.rating}
                label={ratingLabels[progress.rating] ?? progress.rating}
              />
            </div>
            {progress.feedback ? (
              <p className="mt-3 text-[12px] leading-5 text-slate">{progress.feedback}</p>
            ) : null}
          </article>
        ))}
        {!child.latest_progress.length ? (
          <p className="py-8 text-center text-[12px] text-slate">
            لم تُضف تقييمات بعد.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function InvoicesPanel({ child }: { child: FamilyChild }) {
  return (
    <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">الفواتير والمدفوعات</h2>
          <p className="mt-1 text-[12px] text-slate">عرض واضح للمدفوع والمتبقي</p>
        </div>
        <CircleDollarSign size={20} className="text-teal" />
      </div>
      <div className="mt-5 space-y-3">
        {child.invoices.map((invoice) => (
          <article
            key={invoice.id}
            className="flex flex-col gap-3 rounded-2xl bg-cloud p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-bold text-navy">{invoice.invoice_number}</p>
                <StatusBadge
                  value={invoice.status}
                  label={invoiceLabels[invoice.status] ?? invoice.status}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate">
                تاريخ الاستحقاق {formatDate(invoice.due_on)}
              </p>
            </div>
            <div className="sm:text-left">
              <p className="text-xs font-bold text-navy">
                المتبقي {formatCurrency(invoice.balance)}
              </p>
              <p className="mt-1 text-[11px] text-slate">
                من {formatCurrency(invoice.total_amount)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MessagesPanel({ messages }: { messages: Message[] }) {
  return (
    <section id="messages" className="self-start rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-navy">رسائل الأكاديمية</h2>
          <p className="mt-1 text-[12px] text-slate">آخر التحديثات والتنبيهات</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-teal/10 text-teal">
          <MessageCircleMore size={18} />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="rounded-2xl border border-navy/[0.055] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold text-teal">
                {channelLabels[message.channel] ?? message.channel}
              </p>
              <p className="text-[11px] text-slate">{formatDateTime(message.created_at)}</p>
            </div>
            {message.subject ? (
              <h3 className="mt-3 text-[12px] font-bold text-navy">{message.subject}</h3>
            ) : null}
            <p className="mt-2 text-[12px] leading-6 text-slate">{message.body}</p>
            {message.channel !== "internal" && !message.provider_connected ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                محفوظ في سجل الأكاديمية وبانتظار تفعيل قناة الإرسال.
              </p>
            ) : null}
          </article>
        ))}
        {!messages.length ? (
          <p className="py-10 text-center text-[12px] text-slate">لا توجد رسائل بعد.</p>
        ) : null}
      </div>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof School;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-cloud p-3.5">
      <Icon size={15} className="text-teal" />
      <p className="mt-3 text-[11px] text-slate">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-navy">{value}</p>
    </div>
  );
}

function FamilyMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center gap-4">
        <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={19} />
        </span>
        <div>
          <p className="text-lg font-bold text-navy">{value}</p>
          <p className="text-[12px] font-semibold text-slate">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate/70">{hint}</p>
    </article>
  );
}

function FamilySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-52 rounded-[28px] bg-navy/90" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-[430px] rounded-3xl bg-white" />
        <div className="h-[430px] rounded-3xl bg-white" />
      </div>
    </div>
  );
}
