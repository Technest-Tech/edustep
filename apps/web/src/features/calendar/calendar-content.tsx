"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
  ApiCollection,
  ApiItem,
  CalendarData,
  Cohort,
  ClassSession,
  Teacher,
} from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const sessionStatusLabels: Record<string, string> = {
  scheduled: "مجدولة",
  in_progress: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const sessionTone: Record<string, string> = {
  scheduled: "border-sky-200 bg-sky-50/80",
  in_progress: "border-violet-200 bg-violet-50/80",
  completed: "border-emerald-200 bg-emerald-50/70",
  cancelled: "border-slate-200 bg-slate-50 opacity-65",
};

export function CalendarContent() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [weekStart, setWeekStart] = useState(() => startOfAcademyWeek(new Date()));
  const [teacherId, setTeacherId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [status, setStatus] = useState("");
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const calendarQuery = useQuery({
    queryKey: [
      "calendar",
      isoDate(weekStart),
      isoDate(weekEnd),
      teacherId,
      cohortId,
      status,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        from: isoDate(weekStart),
        to: isoDate(weekEnd),
      });
      if (teacherId) params.set("teacher_id", teacherId);
      if (cohortId) params.set("cohort_id", cohortId);
      if (status) params.set("status", status);

      return apiClient<ApiItem<CalendarData>>(`/api/v1/calendar?${params}`);
    },
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiClient<ApiCollection<Teacher>>("/api/v1/teachers"),
    enabled: !isTeacher,
  });
  const cohortsQuery = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => apiClient<ApiCollection<Cohort>>("/api/v1/cohorts?per_page=100"),
  });
  const calendar = calendarQuery.data?.data;
  const sessions = calendar?.sessions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Calendar · مركز الجدولة"
        title="تقويم الأكاديمية"
        description="شاهد كل الحصص في أسبوع واحد، وفلتر حسب المعلم أو الجروب مع حماية تلقائية من تعارض المواعيد."
        actions={
          <>
            <Button variant="secondary" onClick={() => calendarQuery.refetch()}>
              <RefreshCw
                size={15}
                className={calendarQuery.isFetching ? "animate-spin" : ""}
              />
              تحديث
            </Button>
            <Button onClick={() => window.location.assign(isTeacher ? "/teacher/today" : "/groups")}>
              <CalendarCheck2 size={15} className="text-sun" />
              {isTeacher ? "حصص اليوم" : "جدولة حصة"}
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CalendarMetric
          icon={CalendarCheck2}
          label="حصص هذا الأسبوع"
          value={calendar?.summary.total ?? 0}
          hint={`${calendar?.summary.scheduled ?? 0} قادمة`}
          tone="bg-[#edf2fb] text-navy"
        />
        <CalendarMetric
          icon={ShieldCheck}
          label="حصص مكتملة"
          value={calendar?.summary.completed ?? 0}
          hint="تم تسجيل تشغيلها"
          tone="bg-emerald-50 text-emerald-700"
        />
        <CalendarMetric
          icon={Clock3}
          label="ساعات تدريس"
          value={formatHours(calendar?.summary.teaching_minutes ?? 0)}
          hint="بدون الحصص الملغاة"
          tone="bg-violet-50 text-violet-700"
        />
        <CalendarMetric
          icon={UsersRound}
          label="المعلمون الظاهرون"
          value={new Set(sessions.map((session) => session.teacher?.id).filter(Boolean)).size}
          hint="حسب الفلاتر الحالية"
          tone="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_30px_rgba(11,36,84,.035)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              aria-label="الأسبوع السابق"
              onClick={() => setWeekStart((date) => addDays(date, -7))}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setWeekStart(startOfAcademyWeek(new Date()))}
            >
              اليوم
            </Button>
            <Button
              size="icon"
              variant="secondary"
              aria-label="الأسبوع التالي"
              onClick={() => setWeekStart((date) => addDays(date, 7))}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="mr-2">
              <p className="text-[12px] font-bold text-navy">
                {formatWeekRange(weekStart, weekEnd)}
              </p>
              <p className="mt-1 text-[11px] text-slate">السبت — الجمعة</p>
            </div>
          </div>

          <div
            className={`grid gap-2 ${
              isTeacher ? "sm:grid-cols-2 xl:w-[420px]" : "sm:grid-cols-3 xl:w-[630px]"
            }`}
          >
            {!isTeacher ? (
              <FilterSelect
                label="كل المعلمين"
                value={teacherId}
                onChange={setTeacherId}
                options={(teachersQuery.data?.data ?? []).map((teacher) => ({
                  value: teacher.id,
                  label: teacher.name,
                }))}
              />
            ) : null}
            <FilterSelect
              label="كل الجروبات"
              value={cohortId}
              onChange={setCohortId}
              options={(cohortsQuery.data?.data ?? []).map((cohort) => ({
                value: cohort.id,
                label: cohort.name,
              }))}
            />
            <FilterSelect
              label="كل الحالات"
              value={status}
              onChange={setStatus}
              options={[
                { value: "scheduled", label: "مجدولة" },
                { value: "completed", label: "مكتملة" },
                { value: "cancelled", label: "ملغاة" },
              ]}
            />
          </div>
        </div>
      </section>

      {calendarQuery.isLoading ? (
        <CalendarSkeleton />
      ) : calendarQuery.isError ? (
        <section className="grid min-h-72 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
          <div>
            <CircleAlert className="mx-auto text-rose-500" size={28} />
            <p className="mt-3 text-xs font-bold text-navy">تعذر تحميل التقويم</p>
            <Button className="mt-4" variant="secondary" onClick={() => calendarQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)] lg:grid lg:grid-cols-7">
            {days.map((day) => {
              const daySessions = sessionsForDay(sessions, day);
              const today = isoDate(day) === isoDate(new Date());

              return (
                <div
                  key={isoDate(day)}
                  className="min-h-[510px] border-l border-navy/[0.055] last:border-l-0"
                >
                  <div
                    className={cn(
                      "border-b border-navy/[0.055] px-3 py-4 text-center",
                      today ? "bg-navy text-white" : "bg-cloud/55",
                    )}
                  >
                    <p className={cn("text-[11px]", today ? "text-white/55" : "text-slate")}>
                      {day.toLocaleDateString("ar-EG", { weekday: "long" })}
                    </p>
                    <p className="mt-1 text-base font-bold">{day.getDate()}</p>
                  </div>
                  <div className="space-y-2 p-2">
                    {daySessions.map((session) => (
                      <CalendarSessionCard key={session.id} session={session} compact />
                    ))}
                    {!daySessions.length ? (
                      <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-navy/[0.08]">
                        <p className="text-[11px] text-slate/60">لا توجد حصص</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="space-y-3 lg:hidden">
            {days.map((day) => {
              const daySessions = sessionsForDay(sessions, day);

              if (!daySessions.length) return null;

              return (
                <article
                  key={isoDate(day)}
                  className="rounded-2xl border border-navy/[0.065] bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-navy">
                        {day.toLocaleDateString("ar-EG", { weekday: "long" })}
                      </p>
                      <p className="mt-1 text-[11px] text-slate">
                        {day.toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <span className="grid size-8 place-items-center rounded-xl bg-cloud text-[12px] font-bold text-navy">
                      {daySessions.length}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {daySessions.map((session) => (
                      <CalendarSessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </article>
              );
            })}
            {!sessions.length ? (
              <div className="rounded-2xl border border-dashed border-navy/[0.1] bg-white p-10 text-center">
                <CalendarCheck2 className="mx-auto text-teal" size={28} />
                <p className="mt-3 text-[12px] font-semibold text-navy">
                  لا توجد حصص في هذا الأسبوع
                </p>
              </div>
            ) : null}
          </section>
        </>
      )}

      <section className="flex items-center gap-3 rounded-2xl border border-teal/15 bg-teal/[0.055] p-4 text-navy">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-teal shadow-sm">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-[12px] font-bold">حماية التعارض مفعّلة</p>
          <p className="mt-1 text-[11px] leading-4 text-slate">
            النظام يمنع حفظ حصتين متداخلتين لنفس المعلم أو نفس القاعة ويعرض سبب التعارض بوضوح.
          </p>
        </div>
      </section>
    </div>
  );
}

function CalendarSessionCard({
  session,
  compact = false,
}: {
  session: ClassSession;
  compact?: boolean;
}) {
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);

  return (
    <Link
      href={session.cohort ? `/groups/${session.cohort.id}` : "/groups"}
      className={cn(
        "block rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md",
        sessionTone[session.status] ?? sessionTone.scheduled,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-bold text-navy">
          {formatTime(start)}
        </span>
        {!compact ? (
          <StatusBadge
            value={session.status}
            label={sessionStatusLabels[session.status] ?? session.status}
          />
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-4 text-navy">
        {session.cohort?.name ?? session.title}
      </p>
      <p className="mt-1 truncate text-[11px] text-slate">
        {session.cohort?.level ?? session.title}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate">
        {session.cohort?.delivery_mode === "online" ? (
          <MonitorPlay size={11} className="text-teal" />
        ) : (
          <UsersRound size={11} className="text-teal" />
        )}
        <span className="truncate">{session.teacher?.name ?? "غير معيّن"}</span>
      </div>
      {!compact ? (
        <p className="mt-2 text-[11px] text-slate">
          {formatTime(start)} — {formatTime(end)}
        </p>
      ) : null}
    </Link>
  );
}

function CalendarMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-navy">{value}</p>
        <p className="mt-1 text-[12px] font-semibold text-ink">{label}</p>
        <p className="mt-1 text-[11px] text-slate">{hint}</p>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="min-h-10 rounded-xl border border-navy/[0.08] bg-cloud px-3 text-[12px] font-medium text-navy outline-none focus:border-teal"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="h-[420px] rounded-2xl bg-white" />
      ))}
    </div>
  );
}

function startOfAcademyWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const daysSinceSaturday = (date.getDay() + 1) % 7;
  date.setDate(date.getDate() - daysSinceSaturday);

  return date;
}

function addDays(value: Date, amount: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);

  return date;
}

function isoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sessionsForDay(sessions: ClassSession[], day: Date) {
  const target = isoDate(day);

  return sessions.filter((session) => isoDate(new Date(session.starts_at)) === target);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatWeekRange(from: Date, to: Date) {
  const fromLabel = from.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  const toLabel = to.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${fromLabel} — ${toLabel}`;
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours}:${String(remainder).padStart(2, "0")}` : `${hours} س`;
}
