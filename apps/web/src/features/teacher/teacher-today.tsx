"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ApiItem, ClassSession, TeacherTodayData } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarCheck2,
  CircleAlert,
  Clock3,
  Coins,
  ExternalLink,
  FileWarning,
  RefreshCw,
  UsersRound,
  Video,
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  scheduled: "مجدولة",
  in_progress: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export function TeacherToday() {
  const query = useQuery({
    queryKey: ["teacher", "today"],
    queryFn: () => apiClient<ApiItem<TeacherTodayData>>("/api/v1/teacher/today"),
  });
  const data = query.data?.data;

  if (query.isLoading) return <TeacherTodaySkeleton />;

  if (query.isError || !data) {
    return (
      <section className="grid min-h-[60vh] place-items-center rounded-3xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">تعذر تجهيز يومك</h1>
          <Button className="mt-4" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher Workspace · مساحة المعلم"
        title={`أهلًا ${data.teacher.name.split(" ")[0]}، يوم موفق`}
        description={new Intl.DateTimeFormat("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date(`${data.date}T12:00:00`))}
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث يومي
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <TeacherMetric
          icon={CalendarCheck2}
          label="حصص اليوم"
          value={data.summary.today_sessions}
          hint="جاهزة للمتابعة"
          tone="bg-sky-50 text-sky-700"
        />
        <TeacherMetric
          icon={UsersRound}
          label="طلابي النشطون"
          value={data.summary.active_students}
          hint={`${data.summary.active_cohorts} جروبات`}
          tone="bg-teal/10 text-teal"
        />
        <TeacherMetric
          icon={FileWarning}
          label="تقارير ناقصة"
          value={data.summary.missing_reports}
          hint="آخر 14 يومًا"
          tone="bg-amber-50 text-amber-700"
        />
        <TeacherMetric
          icon={Coins}
          label="مستحقات الشهر"
          value={formatCurrency(data.summary.month_earnings)}
          hint="قبل دورة الاعتماد"
          tone="bg-emerald-50 text-emerald-700"
          wide
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-navy/[0.065] bg-white shadow-[0_12px_40px_rgba(11,36,84,.045)]">
            <div className="flex items-center justify-between border-b border-navy/[0.055] p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-bold text-navy">حصص اليوم</h2>
                <p className="mt-1 text-[12px] text-slate">
                  الحضور والتقرير الدراسي من نفس مسار الحصة
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-navy text-xs font-bold text-white">
                {data.today_sessions.length}
              </span>
            </div>

            {data.today_sessions.length ? (
              <div className="divide-y divide-navy/[0.055]">
                {data.today_sessions.map((session) => (
                  <TodaySession key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarCheck2}
                title="لا توجد حصص اليوم"
                description="يمكنك مراجعة جدول الأسبوع أو إنهاء التقارير المتبقية."
              />
            )}
          </section>

          <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-navy">القادم خلال 7 أيام</h2>
                <p className="mt-1 text-[12px] text-slate">نظرة سريعة على أسبوعك</p>
              </div>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal"
              >
                الجدول الكامل
                <ArrowLeft size={13} />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {data.upcoming_sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/groups/${session.cohort?.id}`}
                  className="rounded-2xl border border-navy/[0.065] bg-cloud/55 p-4 transition hover:-translate-y-0.5 hover:border-teal/25 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold text-navy">{session.title}</p>
                      <p className="mt-1 text-[11px] text-slate">{session.cohort?.name}</p>
                    </div>
                    <Clock3 size={16} className="shrink-0 text-teal" />
                  </div>
                  <p className="mt-4 text-[12px] font-semibold text-navy">
                    {formatDateTime(session.starts_at)}
                  </p>
                </Link>
              ))}
              {!data.upcoming_sessions.length ? (
                <p className="col-span-full py-8 text-center text-[12px] text-slate">
                  لا توجد حصص قادمة خلال هذا الأسبوع.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-navy p-5 text-white shadow-[0_18px_50px_rgba(11,36,84,.18)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-sun">
                <BookOpenCheck size={20} />
              </span>
              <div>
                <h2 className="text-sm font-bold">جروباتي</h2>
                <p className="mt-1 text-[11px] text-white/50">الوصول السريع للطلاب والحصص</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {data.cohorts.map((cohort) => (
                <Link
                  key={cohort.id}
                  href={`/groups/${cohort.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.055] p-3.5 transition hover:bg-white/10"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-teal text-[12px] font-bold text-navy">
                    {cohort.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{cohort.name}</span>
                    <span className="mt-1 block text-[11px] text-white/50">
                      {cohort.students_count} طلاب
                    </span>
                  </span>
                  <ArrowLeft size={14} className="text-white/40" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-amber-950">تقارير تحتاج إكمالًا</h2>
                <p className="mt-1 text-[11px] leading-5 text-amber-800">
                  أضف ملخص الحصة ليكتمل سجل الطالب واحتساب التشغيل.
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-white text-amber-700">
                <FileWarning size={17} />
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {data.missing_reports.slice(0, 4).map((session) => (
                <Link
                  key={session.id}
                  href={`/groups/${session.cohort?.id}`}
                  className="block rounded-xl bg-white/75 p-3"
                >
                  <p className="text-[12px] font-semibold text-navy">{session.cohort?.name}</p>
                  <p className="mt-1 text-[11px] text-slate">
                    {formatDateTime(session.starts_at)}
                  </p>
                </Link>
              ))}
              {!data.missing_reports.length ? (
                <p className="rounded-xl bg-white/70 p-4 text-center text-[12px] font-semibold text-emerald-700">
                  ممتاز، كل التقارير مكتملة.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TodaySession({ session }: { session: ClassSession }) {
  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid min-h-16 min-w-20 place-items-center rounded-2xl bg-cloud px-3 text-center">
          <p className="text-base font-bold text-navy">
            {new Date(session.starts_at).toLocaleTimeString("ar-EG", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1 text-[11px] text-slate">موعد البداية</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-navy">{session.cohort?.name}</h3>
            <StatusBadge
              value={session.status}
              label={statusLabels[session.status] ?? session.status}
            />
          </div>
          <p className="mt-2 text-[12px] text-slate">{session.title}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} className="text-teal" />
              {Math.round(
                (new Date(session.ends_at).getTime() -
                  new Date(session.starts_at).getTime()) /
                  60_000,
              )}{" "}
              دقيقة
            </span>
            <span className="inline-flex items-center gap-1.5">
              {session.meeting_url ? <Video size={13} /> : <UsersRound size={13} />}
              {session.meeting_url ? "Online" : session.room_name ?? "داخل الأكاديمية"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {session.meeting_url ? (
            <a
              href={session.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-[12px] font-semibold text-navy"
            >
              دخول الحصة
              <ExternalLink size={14} />
            </a>
          ) : null}
          <Link
            href={`/groups/${session.cohort?.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[12px] font-semibold text-white"
          >
            الحضور والتقرير
            <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TeacherMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  wide = false,
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
  wide?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)] ${
        wide ? "col-span-2 xl:col-span-2" : ""
      }`}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-lg font-bold text-navy">{value}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate">{label}</p>
      <p className="mt-1 text-[11px] text-slate/70">{hint}</p>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarCheck2;
  title: string;
  description: string;
}) {
  return (
    <div className="p-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Icon size={21} />
      </span>
      <p className="mt-4 text-xs font-bold text-navy">{title}</p>
      <p className="mt-2 text-[12px] text-slate">{description}</p>
    </div>
  );
}

function TeacherTodaySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-3xl bg-white" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-[480px] rounded-3xl bg-white" />
    </div>
  );
}
