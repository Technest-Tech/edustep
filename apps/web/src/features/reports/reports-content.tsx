"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ApiItem, OperationsReport } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  CircleAlert,
  CircleDollarSign,
  RefreshCw,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const cohortStatusLabels: Record<string, string> = {
  active: "نشط",
  enrolling: "متاح التسجيل",
};

export function ReportsContent() {
  const query = useQuery({
    queryKey: ["reports", "operations"],
    queryFn: () =>
      apiClient<ApiItem<OperationsReport>>("/api/v1/reports/operations"),
  });
  const report = query.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business Intelligence · مؤشرات الإدارة"
        title="التقارير ومؤشرات الأداء"
        description="رؤية موحدة للتشغيل الأكاديمي، الحضور، التحصيل، التحويل، وأحمال فريق التدريس."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث المؤشرات
          </Button>
        }
      />

      {query.isLoading ? (
        <ReportsSkeleton />
      ) : query.isError || !report ? (
        <section className="grid min-h-72 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
          <div>
            <CircleAlert className="mx-auto text-rose-500" size={30} />
            <p className="mt-3 text-xs font-bold text-navy">تعذر تحميل التقارير</p>
            <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <ReportMetric
              icon={UsersRound}
              label="الطلاب النشطون"
              value={report.summary.active_students}
              hint="طالب حالي"
              tone="bg-[#edf2fb] text-navy"
            />
            <ReportMetric
              icon={BookOpenCheck}
              label="الجروبات النشطة"
              value={report.summary.active_cohorts}
              hint="تعمل الآن"
              tone="bg-violet-50 text-violet-700"
            />
            <ReportMetric
              icon={CalendarCheck2}
              label="انتظام الحضور"
              value={`${report.summary.attendance_rate}%`}
              hint="حاضر ومتأخر"
              tone="bg-emerald-50 text-emerald-700"
            />
            <ReportMetric
              icon={Target}
              label="إكمال الحصص"
              value={`${report.summary.sessions_completion_rate}%`}
              hint="من الجدول المسجل"
              tone="bg-sky-50 text-sky-700"
            />
            <ReportMetric
              icon={TrendingUp}
              label="تحويل العملاء"
              value={`${report.summary.conversion_rate}%`}
              hint="من CRM إلى طالب"
              tone="bg-amber-50 text-amber-700"
            />
            <ReportMetric
              icon={CircleDollarSign}
              label="نسبة التحصيل"
              value={`${report.summary.collection_rate}%`}
              hint="من إجمالي الفواتير"
              tone="bg-teal/10 text-teal"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
            <FinancePerformance report={report} />
            <AttendanceBreakdown report={report} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <LeadSources report={report} />
            <CohortPerformance report={report} />
          </section>

          <TeacherWorkload report={report} />

          <p className="text-left text-[8px] text-slate">
            آخر تحديث: {formatDateTime(report.generated_at)}
          </p>
        </>
      )}
    </div>
  );
}

function FinancePerformance({ report }: { report: OperationsReport }) {
  const maxRevenue = Math.max(
    ...report.finance.monthly_revenue.map((month) => Number(month.amount)),
    1,
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-[0_18px_45px_rgba(11,36,84,.15)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-semibold text-teal-bright">الأداء المالي</p>
          <h2 className="mt-1 text-base font-bold">التحصيل والتدفق النقدي</h2>
        </div>
        <Link
          href="/finance"
          className="rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-[9px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          فتح الحسابات
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DarkMetric label="إجمالي الفواتير" value={formatCurrency(report.finance.billed)} />
        <DarkMetric label="تم تحصيله" value={formatCurrency(report.finance.collected)} accent />
        <DarkMetric label="قيد التحصيل" value={formatCurrency(report.finance.outstanding)} />
        <DarkMetric
          label="متأخر"
          value={formatCurrency(report.finance.overdue)}
          danger
        />
      </div>

      <div className="mt-7 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-white/80">التحصيل خلال 6 أشهر</p>
          <BarChart3 size={17} className="text-teal-bright" />
        </div>
        <div className="mt-5 flex h-36 items-end gap-2 sm:gap-4">
          {report.finance.monthly_revenue.map((month) => {
            const height = Math.max((Number(month.amount) / maxRevenue) * 100, 4);

            return (
              <div key={month.month} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <p className="mb-2 truncate text-center text-[8px] font-semibold text-white/70">
                  {Number(month.amount) ? formatCurrency(month.amount) : "—"}
                </p>
                <div
                  className="min-h-1 rounded-t-lg bg-gradient-to-t from-teal to-teal-bright transition-all"
                  style={{ height: `${height}%` }}
                />
                <p className="mt-2 truncate text-center text-[7px] text-white/40">
                  {month.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
        <DarkMetric
          label="مصروفات التشغيل"
          value={formatCurrency(report.finance.operating_expenses)}
        />
        <DarkMetric
          label="تكلفة المعلمين"
          value={formatCurrency(report.finance.teacher_cost)}
        />
        <DarkMetric
          label="صافي تشغيلي"
          value={formatCurrency(report.finance.net_operating_cash)}
          accent={Number(report.finance.net_operating_cash) >= 0}
          danger={Number(report.finance.net_operating_cash) < 0}
        />
      </div>
    </article>
  );
}

function AttendanceBreakdown({ report }: { report: OperationsReport }) {
  const attendanceItems = [
    { label: "حاضر", value: report.attendance.present, color: "bg-emerald-500" },
    { label: "متأخر", value: report.attendance.late, color: "bg-amber-500" },
    { label: "غائب", value: report.attendance.absent, color: "bg-rose-500" },
    { label: "اعتذار", value: report.attendance.excused, color: "bg-slate-400" },
  ];
  const total = attendanceItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)] sm:p-6">
      <p className="text-[9px] font-semibold text-teal">Attendance Health</p>
      <h2 className="mt-1 text-sm font-bold text-navy">توزيع الحضور</h2>
      <p className="mt-1 text-[8px] text-slate">كل سجلات الحصص المكتملة</p>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-navy">{report.summary.attendance_rate}%</p>
          <p className="mt-1 text-[8px] text-slate">متوسط الانتظام</p>
        </div>
        <div className="grid size-16 place-items-center rounded-full border-[7px] border-emerald-100 bg-cloud text-xs font-bold text-emerald-700">
          {total}
        </div>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-cloud">
        {attendanceItems.map((item) => (
          <div
            key={item.label}
            className={item.color}
            style={{ width: `${total ? (item.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {attendanceItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl bg-cloud/70 p-3">
            <span className="flex items-center gap-2 text-[9px] text-slate">
              <span className={`size-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
            <span className="text-[11px] font-bold text-navy">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function LeadSources({ report }: { report: OperationsReport }) {
  const maximum = Math.max(...report.lead_sources.map((source) => source.count), 1);
  const total = report.lead_sources.reduce((sum, source) => sum + source.count, 0);

  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)] sm:p-6">
      <p className="text-[9px] font-semibold text-teal">CRM Acquisition</p>
      <h2 className="mt-1 text-sm font-bold text-navy">مصادر العملاء</h2>
      <p className="mt-1 text-[8px] text-slate">{total} فرصة مسجلة</p>
      <div className="mt-6 space-y-4">
        {report.lead_sources.map((source) => (
          <div key={source.source}>
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-medium text-ink">{source.label}</span>
              <span className="font-bold text-navy">{source.count}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cloud">
              <div
                className="h-full rounded-full bg-gradient-to-l from-navy to-teal"
                style={{ width: `${(source.count / maximum) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CohortPerformance({ report }: { report: OperationsReport }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
      <div className="flex items-start justify-between gap-3 border-b border-navy/[0.055] p-5">
        <div>
          <h2 className="text-sm font-bold text-navy">صحة الجروبات</h2>
          <p className="mt-1 text-[8px] text-slate">الإشغال والحصص وانتظام الحضور</p>
        </div>
        <Link href="/groups" className="text-[9px] font-semibold text-teal hover:text-navy">
          إدارة الجروبات
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-cloud/55 text-right text-[8px] font-semibold text-slate">
              <th className="px-5 py-3">الجروب</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الإشغال</th>
              <th className="px-4 py-3">الحصص</th>
              <th className="px-5 py-3">الحضور</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.05]">
            {report.cohorts.map((cohort) => (
              <tr key={cohort.id} className="transition hover:bg-cloud/50">
                <td className="px-5 py-4">
                  <Link href={`/groups/${cohort.id}`} className="block">
                    <p className="text-[10px] font-bold text-navy">{cohort.name}</p>
                    <p className="mt-1 text-[8px] text-slate">
                      {cohort.teacher ?? "بدون معلم"} · {cohort.level}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    value={cohort.status}
                    label={cohortStatusLabels[cohort.status] ?? cohort.status}
                  />
                </td>
                <td className="px-4 py-4">
                  <p className="text-[10px] font-bold text-navy">
                    {cohort.active_students}/{cohort.capacity}
                  </p>
                  <p className="mt-1 text-[8px] text-slate">{cohort.occupancy_rate}%</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[10px] font-bold text-navy">
                    {cohort.completed_sessions}/{cohort.sessions}
                  </p>
                  <p className="mt-1 text-[8px] text-slate">مكتملة</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-cloud">
                      <div
                        className={`h-full rounded-full ${
                          cohort.attendance_rate >= 80 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${cohort.attendance_rate}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-navy">
                      {cohort.attendance_rate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function TeacherWorkload({ report }: { report: OperationsReport }) {
  return (
    <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold text-teal">Team Capacity</p>
          <h2 className="mt-1 text-sm font-bold text-navy">أحمال فريق التدريس</h2>
          <p className="mt-1 text-[8px] text-slate">الجروبات والطلاب والحصص لكل معلم</p>
        </div>
        <Link href="/teachers" className="text-[9px] font-semibold text-teal hover:text-navy">
          ملف المعلمين
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {report.teachers.map((teacher) => (
          <article key={teacher.id} className="rounded-2xl border border-navy/[0.055] bg-cloud/55 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-navy text-[11px] font-bold text-white">
                {teacher.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-navy">{teacher.name}</p>
                <p className="mt-1 text-[8px] text-slate">معلم نشط</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="الجروبات" value={teacher.active_cohorts} />
              <MiniStat label="الطلاب" value={teacher.active_students} />
              <MiniStat label="حصص مكتملة" value={teacher.completed_sessions} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-ink">{label}</p>
      <p className="mt-1 text-[8px] text-slate">{hint}</p>
    </article>
  );
}

function DarkMetric({
  label,
  value,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.065] p-3.5">
      <p className="text-[8px] text-white/45">{label}</p>
      <p
        className={`mt-2 truncate text-sm font-bold ${
          danger ? "text-rose-300" : accent ? "text-teal-bright" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-2.5 text-center">
      <p className="text-sm font-bold text-navy">{value}</p>
      <p className="mt-1 text-[7px] text-slate">{label}</p>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-96 rounded-2xl bg-white" />
        <div className="h-96 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
