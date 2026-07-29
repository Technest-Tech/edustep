"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/format";
import type {
  AcademicProgressData,
  AcademicProgressStudent,
  AcademicRisk,
  ApiItem,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck2,
  ChartNoAxesCombined,
  ChevronLeft,
  CircleAlert,
  ClipboardPlus,
  FileCheck2,
  FileClock,
  Filter,
  Gauge,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useDeferredValue, useMemo, useState } from "react";

const ratingLabels: Record<string, string> = {
  needs_improvement: "يحتاج دعمًا",
  developing: "في تطور",
  good: "جيد",
  excellent: "ممتاز",
};

const riskTypeLabels: Record<string, string> = {
  attendance: "الحضور",
  performance: "الأداء",
  engagement: "المشاركة",
  homework: "الواجبات",
  behavior: "السلوك",
  other: "أخرى",
};

const severityLabels: Record<string, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
};

const interventionStatusLabels: Record<string, string> = {
  planned: "مخطط",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

type ActiveDialog =
  | { type: "report"; student: AcademicProgressStudent }
  | { type: "risk"; student: AcademicProgressStudent }
  | { type: "intervention"; student: AcademicProgressStudent; risk: AcademicRisk }
  | null;

export function AcademicProgressContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "risk" | "healthy" | "draft">("all");
  const [selected, setSelected] = useState<AcademicProgressStudent | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({
    queryKey: ["academic-progress"],
    queryFn: () => apiClient<ApiItem<AcademicProgressData>>("/api/v1/academic-progress"),
  });
  const data = query.data?.data;
  const currentSelected =
    data?.students.find((student) => student.id === selected?.id) ?? selected;
  const students = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return (data?.students ?? []).filter((student) => {
      const matchesSearch =
        !normalized ||
        student.full_name.toLowerCase().includes(normalized) ||
        student.student_code.toLowerCase().includes(normalized) ||
        student.cohort?.name.toLowerCase().includes(normalized);
      const matchesFilter =
        filter === "all" ||
        (filter === "risk" && student.open_risks.length > 0) ||
        (filter === "healthy" && student.open_risks.length === 0) ||
        (filter === "draft" && student.reports.some((report) => report.status === "draft"));

      return matchesSearch && matchesFilter;
    });
  }, [data?.students, deferredSearch, filter]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["academic-progress"] });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Success · جودة المخرجات التعليمية"
        title="التقدم والتقارير الأكاديمية"
        description="مركز مبكر لاكتشاف التراجع، متابعة خطط التدخل، وتجهيز تقارير دورية قابلة للنشر لولي الأمر."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ProgressMetric icon={ChartNoAxesCombined} value={data?.summary.students ?? 0} label="طلاب تحت المتابعة" tone="bg-sky-50 text-sky-700" />
        <ProgressMetric icon={ShieldAlert} value={data?.summary.at_risk ?? 0} label="يحتاجون تدخلًا" tone="bg-rose-50 text-rose-700" />
        <ProgressMetric icon={Target} value={data?.summary.open_interventions ?? 0} label="خطط تدخل مفتوحة" tone="bg-amber-50 text-amber-700" />
        <ProgressMetric icon={FileClock} value={data?.summary.draft_reports ?? 0} label="تقارير بانتظار النشر" tone="bg-violet-50 text-violet-700" />
        <ProgressMetric icon={FileCheck2} value={data?.summary.published_this_month ?? 0} label="نُشرت هذا الشهر" tone="bg-emerald-50 text-emerald-700" />
      </section>

      <section className="overflow-hidden rounded-3xl border border-navy/[0.065] bg-white shadow-[0_14px_44px_rgba(11,36,84,.04)]">
        <div className="flex flex-col gap-3 border-b border-navy/[0.055] p-4 lg:flex-row lg:items-center lg:p-5">
          <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud/70 px-3.5 text-slate">
            <Search size={17} />
            <span className="sr-only">البحث في تقدم الطلاب</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الطالب، الكود أو الجروب..."
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={15} className="shrink-0 text-slate" />
            {([
              ["all", "الكل"],
              ["risk", "بحاجة لتدخل"],
              ["healthy", "مستقر"],
              ["draft", "مسودة تقرير"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
                  filter === value ? "bg-navy text-white" : "bg-cloud text-slate hover:text-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-2xl bg-cloud" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <CircleAlert className="mx-auto text-rose-500" size={28} />
              <p className="mt-3 text-xs font-bold text-navy">تعذر تحميل متابعة التقدم</p>
              <Button className="mt-4" onClick={() => query.refetch()}>إعادة المحاولة</Button>
            </div>
          </div>
        ) : students.length ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 xl:p-5">
            {students.map((student) => (
              <StudentProgressCard
                key={student.id}
                student={student}
                onOpen={() => setSelected(student)}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <BadgeCheck className="mx-auto text-teal" size={30} />
              <p className="mt-3 text-xs font-bold text-navy">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-[12px] text-slate">جرّب تغيير البحث أو الفلتر.</p>
            </div>
          </div>
        )}
      </section>

      <StudentProgressPanel
        student={currentSelected}
        canPublish={user?.role !== "teacher"}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onReport={(student) => setActiveDialog({ type: "report", student })}
        onRisk={(student) => setActiveDialog({ type: "risk", student })}
        onIntervention={(student, risk) => setActiveDialog({ type: "intervention", student, risk })}
        onUpdated={refresh}
      />

      {activeDialog?.type === "report" ? (
        <ReportDialog
          student={activeDialog.student}
          open
          onClose={() => setActiveDialog(null)}
          onCreated={() => {
            setActiveDialog(null);
            setSelected(null);
            refresh();
          }}
        />
      ) : null}
      {activeDialog?.type === "risk" ? (
        <RiskDialog
          student={activeDialog.student}
          open
          onClose={() => setActiveDialog(null)}
          onCreated={() => {
            setActiveDialog(null);
            setSelected(null);
            refresh();
          }}
        />
      ) : null}
      {activeDialog?.type === "intervention" ? (
        <InterventionDialog
          student={activeDialog.student}
          risk={activeDialog.risk}
          open
          onClose={() => setActiveDialog(null)}
          onCreated={() => {
            setActiveDialog(null);
            setSelected(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function StudentProgressCard({
  student,
  onOpen,
}: {
  student: AcademicProgressStudent;
  onOpen: () => void;
}) {
  const latestReport = student.reports[0];
  const hasRisk = student.open_risks.length > 0;

  return (
    <article className="group rounded-2xl border border-navy/[0.06] bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-[0_14px_34px_rgba(11,36,84,.07)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-sm font-bold text-white">
          {student.full_name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-bold text-navy">{student.full_name}</h2>
              <p className="mt-1 font-mono text-[11px] text-slate">{student.student_code}</p>
            </div>
            {hasRisk ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                {student.open_risks.length} تنبيه
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                مستقر
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-[12px] text-slate">{student.cohort?.name ?? "غير مسجل"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ScoreBox label="الحضور" value={`${student.attendance_rate}%`} good={student.attendance_rate >= 80} />
        <ScoreBox label="متوسط التقييم" value={student.average_score === null ? "—" : `${student.average_score}%`} good={(student.average_score ?? 100) >= 70} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-cloud/75 p-3">
        <div>
          <p className="text-[11px] text-slate">آخر تقرير</p>
          <p className="mt-1 max-w-40 truncate text-[12px] font-semibold text-navy">
            {latestReport?.period_label ?? "لم يُنشأ بعد"}
          </p>
        </div>
        {latestReport ? (
          <StatusBadge
            value={latestReport.status}
            label={latestReport.status === "published" ? "منشور" : "مسودة"}
          />
        ) : null}
      </div>

      <Button className="mt-4 w-full" variant="secondary" onClick={onOpen}>
        فتح ملف النجاح
        <ChevronLeft size={14} />
      </Button>
    </article>
  );
}

function StudentProgressPanel({
  student,
  canPublish,
  open,
  onOpenChange,
  onReport,
  onRisk,
  onIntervention,
  onUpdated,
}: {
  student: AcademicProgressStudent | null;
  canPublish: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: (student: AcademicProgressStudent) => void;
  onRisk: (student: AcademicProgressStudent) => void;
  onIntervention: (student: AcademicProgressStudent, risk: AcademicRisk) => void;
  onUpdated: () => void;
}) {
  const publish = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/progress-reports/${id}/publish`, { method: "POST" }),
    onSuccess: onUpdated,
  });
  const updateRisk = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/academic-risks/${id}`, {
        method: "PATCH",
        json: { status: "resolved" },
      }),
    onSuccess: onUpdated,
  });
  const completeIntervention = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/academic-interventions/${id}`, {
        method: "PATCH",
        json: { status: "completed", outcome: "تم تنفيذ الخطة ومراجعة أثرها مع الطالب." },
      }),
    onSuccess: onUpdated,
  });

  if (!student) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content dir="rtl" className="fixed inset-y-0 left-0 z-50 w-full max-w-[620px] overflow-y-auto border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-lg font-bold text-white">
                {student.full_name.charAt(0)}
              </span>
              <div className="min-w-0">
                <Dialog.Title className="truncate text-lg font-bold text-navy">{student.full_name}</Dialog.Title>
                <Dialog.Description className="mt-1 text-[12px] text-slate">
                  {student.student_code} · {student.cohort?.name ?? "غير مسجل"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق ملف التقدم"><X size={17} /></Button>
            </Dialog.Close>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <MiniMetric icon={CalendarCheck2} label="الحضور" value={`${student.attendance_rate}%`} />
            <MiniMetric icon={Gauge} label="متوسط التقييم" value={student.average_score === null ? "—" : `${student.average_score}%`} />
            <MiniMetric icon={BookOpenCheck} label="التقييمات" value={String(student.assessments_count)} />
          </div>

          <section className="mt-6 rounded-2xl border border-navy/[0.065] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-navy">المخاطر وخطط التدخل</h2>
                <p className="mt-1 text-[11px] text-slate">تنبيهات يدوية وآلية مع مسؤول وخطة قابلة للقياس</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onRisk(student)}>
                <ShieldAlert size={14} />
                إضافة تنبيه
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {student.open_risks.map((risk) => (
                <article key={risk.id} className="rounded-2xl bg-rose-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-rose-700">
                          {severityLabels[risk.severity]} · {riskTypeLabels[risk.type]}
                        </span>
                        {risk.is_automatic ? <span className="text-[11px] text-slate">كشف تلقائي</span> : null}
                      </div>
                      <h3 className="mt-2 text-[12px] font-bold text-navy">{risk.title}</h3>
                      {risk.description ? <p className="mt-1 text-[11px] leading-5 text-slate">{risk.description}</p> : null}
                    </div>
                    <StatusBadge value={risk.status} label={risk.status === "monitoring" ? "تحت المتابعة" : "مفتوح"} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {risk.interventions.map((item) => (
                      <div key={item.id} className="rounded-xl bg-white/85 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-semibold text-navy">{item.title}</p>
                            <p className="mt-1 text-[11px] text-slate">
                              {item.owner?.name ?? "غير مسند"} · {item.due_on ? formatDate(item.due_on) : "بدون موعد"}
                            </p>
                          </div>
                          <StatusBadge value={item.status} label={interventionStatusLabels[item.status]} />
                        </div>
                        {item.status !== "completed" && item.status !== "cancelled" ? (
                          <Button
                            className="mt-2"
                            size="sm"
                            variant="ghost"
                            disabled={completeIntervention.isPending}
                            onClick={() => completeIntervention.mutate(item.id)}
                          >
                            <BadgeCheck size={13} />
                            تسجيل التنفيذ
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onIntervention(student, risk)}>
                      <Target size={13} />
                      خطة تدخل
                    </Button>
                    <Button size="sm" variant="ghost" disabled={updateRisk.isPending} onClick={() => updateRisk.mutate(risk.id)}>
                      إغلاق التنبيه
                    </Button>
                  </div>
                </article>
              ))}
              {!student.open_risks.length ? (
                <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                  <BadgeCheck className="mx-auto text-emerald-600" size={24} />
                  <p className="mt-2 text-[12px] font-bold text-emerald-800">لا توجد مخاطر مفتوحة</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-navy">التقارير الدورية</h2>
                <p className="mt-1 text-[11px] text-slate">المسودات والتقارير المنشورة لولي الأمر</p>
              </div>
              <Button size="sm" onClick={() => onReport(student)}>
                <ClipboardPlus size={14} />
                تقرير جديد
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {student.reports.map((report) => (
                <article key={report.id} className="rounded-xl border border-navy/[0.055] bg-cloud/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold text-navy">{report.period_label}</p>
                      <p className="mt-1 text-[11px] text-slate">
                        {formatDate(report.period_starts_on)} — {formatDate(report.period_ends_on)}
                      </p>
                    </div>
                    <StatusBadge value={report.status} label={report.status === "published" ? "منشور" : "مسودة"} />
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-slate">{report.summary}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-teal">
                      {ratingLabels[report.overall_rating]}
                      {report.overall_score ? ` · ${Number(report.overall_score)}%` : ""}
                    </span>
                    {report.status === "draft" && canPublish ? (
                      <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(report.id)}>
                        <Sparkles size={13} className="text-sun" />
                        نشر للأسرة
                      </Button>
                    ) : report.published_at ? (
                      <span className="text-[11px] text-slate">{formatDateTime(report.published_at)}</span>
                    ) : null}
                  </div>
                </article>
              ))}
              {!student.reports.length ? <p className="py-7 text-center text-[12px] text-slate">لم تُنشأ تقارير بعد.</p> : null}
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReportDialog({
  student,
  open,
  onClose,
  onCreated,
}: {
  student: AcademicProgressStudent;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [label, setLabel] = useState(`تقرير ${new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(new Date())}`);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rating, setRating] = useState("good");
  const [score, setScore] = useState(student.average_score?.toString() ?? "");
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/students/${student.id}/progress-reports`, {
        method: "POST",
        json: {
          enrollment_id: student.cohort?.enrollment_id ?? null,
          level_id: student.cohort?.level_id ?? null,
          period_label: label,
          period_starts_on: from,
          period_ends_on: to,
          overall_score: score ? Number(score) : null,
          overall_rating: rating,
          attendance_rate: student.attendance_rate,
          summary,
          strengths: strengths || null,
          areas_for_improvement: improvements || null,
          next_steps: nextSteps || null,
        },
      }),
    onSuccess: onCreated,
  });

  return (
    <FormDialog open={open} onClose={onClose} title="تقرير تقدم جديد" description={`تجهيز مسودة تقرير دوري للطالب ${student.full_name}.`}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <Field label="اسم الفترة"><input required value={label} onChange={(event) => setLabel(event.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="من تاريخ"><input required type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
          <Field label="إلى تاريخ"><input required type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="التقدير العام">
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="needs_improvement">يحتاج دعمًا</option>
              <option value="developing">في تطور</option>
              <option value="good">جيد</option>
              <option value="excellent">ممتاز</option>
            </select>
          </Field>
          <Field label="الدرجة من 100"><input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></Field>
        </div>
        <Field label="الملخص"><textarea required rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="ملخص واضح لمستوى الطالب خلال الفترة..." /></Field>
        <Field label="نقاط القوة"><textarea rows={2} value={strengths} onChange={(event) => setStrengths(event.target.value)} /></Field>
        <Field label="نقاط التحسين"><textarea rows={2} value={improvements} onChange={(event) => setImprovements(event.target.value)} /></Field>
        <Field label="الخطوات القادمة"><textarea rows={2} value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} /></Field>
        <DialogActions pending={mutation.isPending} onCancel={onClose} submit="حفظ كمسودة" />
      </form>
    </FormDialog>
  );
}

function RiskDialog({ student, open, onClose, onCreated }: { student: AcademicProgressStudent; open: boolean; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState("performance");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () => apiClient(`/api/v1/students/${student.id}/academic-risks`, {
      method: "POST",
      json: { enrollment_id: student.cohort?.enrollment_id ?? null, type, severity, title, description: description || null },
    }),
    onSuccess: onCreated,
  });

  return (
    <FormDialog open={open} onClose={onClose} title="إضافة تنبيه أكاديمي" description={`توثيق نقطة تحتاج متابعة للطالب ${student.full_name}.`}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع التنبيه"><select value={type} onChange={(event) => setType(event.target.value)}>{Object.entries(riskTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="درجة الخطورة"><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">مرتفع</option><option value="critical">حرج</option></select></Field>
        </div>
        <Field label="عنوان التنبيه"><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="الوصف"><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="ما الذي لوحظ؟ وما أثره المتوقع؟" /></Field>
        <DialogActions pending={mutation.isPending} onCancel={onClose} submit="إضافة التنبيه" />
      </form>
    </FormDialog>
  );
}

function InterventionDialog({ student, risk, open, onClose, onCreated }: { student: AcademicProgressStudent; risk: AcademicRisk; open: boolean; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState("parent_call");
  const [title, setTitle] = useState("");
  const [plan, setPlan] = useState("");
  const [dueOn, setDueOn] = useState("");
  const mutation = useMutation({
    mutationFn: () => apiClient(`/api/v1/academic-risks/${risk.id}/interventions`, {
      method: "POST",
      json: { type, title, plan, due_on: dueOn || null },
    }),
    onSuccess: onCreated,
  });

  return (
    <FormDialog open={open} onClose={onClose} title="خطة تدخل جديدة" description={`${student.full_name} · ${risk.title}`}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <Field label="نوع التدخل"><select value={type} onChange={(event) => setType(event.target.value)}><option value="parent_call">اتصال بولي الأمر</option><option value="extra_session">حصة دعم</option><option value="practice_plan">خطة تدريب</option><option value="teacher_follow_up">متابعة المعلم</option><option value="counseling">إرشاد أكاديمي</option><option value="other">أخرى</option></select></Field>
        <Field label="عنوان الخطة"><input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="تفاصيل التنفيذ"><textarea required rows={4} value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="الإجراء، المسؤول، ومؤشر النجاح..." /></Field>
        <Field label="موعد المراجعة"><input type="date" min={today()} value={dueOn} onChange={(event) => setDueOn(event.target.value)} /></Field>
        <DialogActions pending={mutation.isPending} onCancel={onClose} submit="إنشاء الخطة" />
      </form>
    </FormDialog>
  );
}

function FormDialog({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-navy/40 backdrop-blur-[2px]" />
        <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-[570px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title><Dialog.Description className="mt-1 text-[12px] leading-5 text-slate">{description}</Dialog.Description></div>
            <Dialog.Close asChild><Button size="icon" variant="secondary" aria-label="إغلاق"><X size={16} /></Button></Dialog.Close>
          </div>
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-navy [&_input]:mt-2 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-navy/10 [&_input]:px-3 [&_input]:text-[12px] [&_input]:outline-none [&_input]:focus:border-teal/50 [&_select]:mt-2 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-navy/10 [&_select]:bg-white [&_select]:px-3 [&_select]:text-[12px] [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-navy/10 [&_textarea]:p-3 [&_textarea]:text-[12px] [&_textarea]:outline-none [&_textarea]:focus:border-teal/50">{label}{children}</label>;
}

function DialogActions({ pending, onCancel, submit }: { pending: boolean; onCancel: () => void; submit: string }) {
  return <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onCancel}>إلغاء</Button><Button type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : submit}</Button></div>;
}

function ProgressMetric({ icon: Icon, value, label, tone }: { icon: typeof Activity; value: number; label: string; tone: string }) {
  return <article className="rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-2xl ${tone}`}><Icon size={18} /></span><div><p className="text-xl font-bold text-navy">{value}</p><p className="mt-0.5 text-[11px] text-slate">{label}</p></div></div></article>;
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <div className="rounded-2xl bg-cloud p-3"><Icon size={15} className="text-teal" /><p className="mt-2 text-sm font-bold text-navy">{value}</p><p className="mt-1 text-[11px] text-slate">{label}</p></div>;
}

function ScoreBox({ label, value, good }: { label: string; value: string; good: boolean }) {
  return <div className={`rounded-xl p-3 ${good ? "bg-emerald-50" : "bg-amber-50"}`}><p className={`text-sm font-bold ${good ? "text-emerald-700" : "text-amber-700"}`}>{value}</p><p className="mt-1 text-[11px] text-slate">{label}</p></div>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
