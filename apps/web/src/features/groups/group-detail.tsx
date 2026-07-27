"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type {
  ApiItem,
  ClassSession,
  CohortDetail,
  CohortStudent,
  ProgressEntry,
  ScheduleGenerationResult,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileChartColumnIncreasing,
  GraduationCap,
  Hourglass,
  MapPin,
  MonitorPlay,
  NotebookPen,
  Plus,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useMemo, useState, type ReactElement } from "react";

const cohortStatusLabels: Record<string, string> = {
  active: "نشط",
  enrolling: "متاح التسجيل",
  planned: "مخطط",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const sessionStatusLabels: Record<string, string> = {
  scheduled: "مجدولة",
  in_progress: "تعمل الآن",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const attendanceLabels: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "اعتذار",
};

const ratingLabels: Record<string, string> = {
  needs_improvement: "يحتاج تحسين",
  developing: "في تطور",
  good: "جيد",
  excellent: "ممتاز",
};

type ActiveDialog =
  | { type: "session" }
  | { type: "generate-schedule" }
  | { type: "attendance"; session: ClassSession }
  | { type: "progress"; student: CohortStudent }
  | null;

export function GroupDetail({ cohortId }: { cohortId: string }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const query = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: () => apiClient<ApiItem<CohortDetail>>(`/api/v1/cohorts/${cohortId}`),
  });

  if (query.isLoading) {
    return <GroupDetailSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="grid min-h-96 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">تعذر تحميل لوحة الجروب</h1>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const cohort = query.data.data;
  const nextSession = cohort.sessions
    .filter((session) => session.status === "scheduled")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/groups"
          className="mb-4 inline-flex items-center gap-1.5 text-[9px] font-semibold text-teal"
        >
          <ArrowRight size={13} />
          العودة إلى الجروبات
        </Link>
        <PageHeader
          eyebrow={`${cohort.program.name_ar} · ${cohort.level.name_ar}`}
          title={cohort.name}
          description={`${cohort.code} · ${cohort.delivery_mode === "online" ? "أونلاين" : "حضوري"} · ${cohort.teacher?.name ?? "لم يعيّن معلم"}`}
          actions={
            <>
              {nextSession?.meeting_url ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    window.open(nextSession.meeting_url ?? "", "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink size={15} />
                  دخول الحصة
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => setActiveDialog({ type: "generate-schedule" })}
              >
                <CalendarRange size={15} />
                توليد الجدول
              </Button>
              <Button onClick={() => setActiveDialog({ type: "session" })}>
                <Plus size={15} className="text-sun" />
                جدولة حصة
              </Button>
            </>
          }
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GroupMetric
          icon={UsersRound}
          label="الطلاب المسجلون"
          value={`${cohort.enrolled_count}/${cohort.capacity}`}
          hint={`${cohort.reserved_seats} محجوز · ${cohort.available_seats} متاح`}
          tone="bg-mist text-teal"
        />
        <GroupMetric
          icon={CalendarCheck2}
          label="الحصص المكتملة"
          value={String(cohort.metrics.sessions_completed)}
          hint={`${cohort.metrics.sessions_upcoming} حصص قادمة`}
          tone="bg-violet-50 text-violet-700"
        />
        <GroupMetric
          icon={ClipboardCheck}
          label="متوسط الحضور"
          value={`${cohort.metrics.attendance_rate}%`}
          hint="الحضور والتأخير"
          tone="bg-emerald-50 text-emerald-700"
        />
        <GroupMetric
          icon={FileChartColumnIncreasing}
          label="قيمة التسجيلات"
          value={formatCurrency(cohort.metrics.collected_enrollment_value)}
          hint="صافي رسوم الجروب"
          tone="bg-amber-50 text-amber-700"
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          <SessionsPanel
            sessions={cohort.sessions}
            onAttendance={(session) =>
              setActiveDialog({ type: "attendance", session })
            }
          />
          <StudentsPanel
            students={cohort.students}
            onProgress={(student) => setActiveDialog({ type: "progress", student })}
          />
        </div>
        <div className="space-y-5">
          <NextSessionCard session={nextSession} />
          <GroupInformation cohort={cohort} />
          <GroupWaitlist cohort={cohort} />
        </div>
      </div>

      <CreateSessionDialog
        cohort={cohort}
        open={activeDialog?.type === "session"}
        onClose={() => setActiveDialog(null)}
      />
      <GenerateScheduleDialog
        cohort={cohort}
        open={activeDialog?.type === "generate-schedule"}
        onClose={() => setActiveDialog(null)}
      />
      {activeDialog?.type === "attendance" ? (
        <AttendanceDialog
          cohort={cohort}
          session={activeDialog.session}
          open
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
      {activeDialog?.type === "progress" ? (
        <ProgressDialog
          cohort={cohort}
          student={activeDialog.student}
          open
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
    </div>
  );
}

function GroupWaitlist({ cohort }: { cohort: CohortDetail }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center justify-between border-b border-navy/[0.055] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-navy">قائمة انتظار الجروب</h2>
          <p className="mt-1 text-[9px] text-slate">بالأولوية ووقت الانضمام</p>
        </div>
        <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <Hourglass size={16} />
        </div>
      </div>
      {cohort.waitlist.length ? (
        <div className="divide-y divide-navy/[0.05]">
          {cohort.waitlist.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid size-7 place-items-center rounded-lg bg-cloud text-[8px] font-bold text-navy">
                {entry.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-semibold text-ink">
                  {entry.lead?.full_name ?? "عميل"}
                </p>
                <p className="mt-1 text-[8px] text-slate">
                  {formatDateTime(entry.joined_at)}
                </p>
              </div>
              {entry.lead?.id ? (
                <Link href={`/leads/${entry.lead.id}`} className="text-[8px] font-semibold text-teal">
                  فتح الملف
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-[9px] text-slate">
          لا يوجد عملاء على قائمة الانتظار.
        </p>
      )}
    </section>
  );
}

function SessionsPanel({
  sessions,
  onAttendance,
}: {
  sessions: ClassSession[];
  onAttendance: (session: ClassSession) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center justify-between border-b border-navy/[0.055] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-navy">الحصص والجدول</h2>
          <p className="mt-1 text-[9px] text-slate">الأحدث أولًا مع حالة الحضور</p>
        </div>
        <div className="grid size-9 place-items-center rounded-xl bg-mist text-teal">
          <CalendarDays size={17} />
        </div>
      </div>

      {sessions.length ? (
        <div className="divide-y divide-navy/[0.05]">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="grid gap-4 px-5 py-4 transition hover:bg-cloud/55 sm:grid-cols-[115px_minmax(0,1fr)_155px] sm:items-center"
            >
              <div>
                <p className="text-[10px] font-bold text-navy">
                  {formatDate(session.starts_at)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[8px] text-slate">
                  <Clock3 size={11} />
                  {new Intl.DateTimeFormat("ar-EG", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(session.starts_at))}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-[11px] font-semibold text-ink">
                    {session.title}
                  </h3>
                  <StatusBadge
                    value={session.status}
                    label={sessionStatusLabels[session.status] ?? session.status}
                  />
                </div>
                <p className="mt-1.5 line-clamp-1 text-[8px] text-slate">
                  {session.lesson_focus ?? "لم يحدد هدف الحصة"}
                </p>
                {session.attendance_summary.recorded ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-[8px]">
                    <span className="text-emerald-700">
                      {session.attendance_summary.present} حاضر
                    </span>
                    <span className="text-amber-700">
                      {session.attendance_summary.late} متأخر
                    </span>
                    <span className="text-rose-600">
                      {session.attendance_summary.absent} غائب
                    </span>
                  </div>
                ) : null}
              </div>
              <Button
                size="sm"
                variant={session.status === "completed" ? "secondary" : "primary"}
                onClick={() => onAttendance(session)}
              >
                <ClipboardCheck size={14} />
                {session.attendance_summary.recorded ? "مراجعة الحضور" : "تسجيل الحضور"}
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center p-8 text-center">
          <div>
            <CalendarDays className="mx-auto text-teal" size={28} />
            <p className="mt-3 text-[10px] font-semibold text-navy">لا توجد حصص بعد</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StudentsPanel({
  students,
  onProgress,
}: {
  students: CohortStudent[];
  onProgress: (student: CohortStudent) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center justify-between border-b border-navy/[0.055] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-navy">طلاب الجروب</h2>
          <p className="mt-1 text-[9px] text-slate">الحضور وآخر تقييم لكل طالب</p>
        </div>
        <span className="rounded-full bg-navy px-2.5 py-1 text-[8px] font-bold text-white">
          {students.length}
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-cloud/55 text-right text-[8px] font-semibold text-slate">
              <th className="px-5 py-3">الطالب</th>
              <th className="px-4 py-3">نسبة الحضور</th>
              <th className="px-4 py-3">الغياب</th>
              <th className="px-4 py-3">آخر تقييم</th>
              <th className="px-5 py-3 text-left">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/[0.05]">
            {students.map((student) => (
              <StudentRow key={student.id} student={student} onProgress={onProgress} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-navy/[0.05] md:hidden">
        {students.map((student) => (
          <StudentMobileCard
            key={student.id}
            student={student}
            onProgress={onProgress}
          />
        ))}
      </div>
    </section>
  );
}

function StudentRow({
  student,
  onProgress,
}: {
  student: CohortStudent;
  onProgress: (student: CohortStudent) => void;
}) {
  const progress = student.latest_progress[0];

  return (
    <tr className="transition hover:bg-cloud/55">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-mist text-[10px] font-bold text-navy">
            {student.full_name.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink">{student.full_name}</p>
            <p className="mt-1 font-mono text-[8px] text-slate">{student.student_code}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <AttendanceRate value={student.attendance_rate} />
      </td>
      <td className="px-4 py-4">
        <span className={student.absences > 1 ? "text-[9px] font-bold text-rose-600" : "text-[9px] text-slate"}>
          {student.absences}
        </span>
      </td>
      <td className="px-4 py-4">
        {progress ? <ProgressBadge progress={progress} /> : <span className="text-[8px] text-slate">لم يقيّم</span>}
      </td>
      <td className="px-5 py-4 text-left">
        <Button size="sm" variant="ghost" onClick={() => onProgress(student)}>
          <NotebookPen size={14} />
          إضافة تقييم
        </Button>
      </td>
    </tr>
  );
}

function StudentMobileCard({
  student,
  onProgress,
}: {
  student: CohortStudent;
  onProgress: (student: CohortStudent) => void;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-ink">{student.full_name}</p>
          <p className="mt-1 font-mono text-[8px] text-slate">{student.student_code}</p>
        </div>
        <AttendanceRate value={student.attendance_rate} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-cloud p-3">
        <span className="text-[8px] text-slate">{student.absences} غياب</span>
        {student.latest_progress[0] ? (
          <ProgressBadge progress={student.latest_progress[0]} />
        ) : (
          <span className="text-[8px] text-slate">لم يقيّم</span>
        )}
        <Button size="sm" variant="ghost" onClick={() => onProgress(student)}>
          تقييم
        </Button>
      </div>
    </article>
  );
}

function NextSessionCard({ session }: { session?: ClassSession }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-[0_16px_40px_rgba(11,36,84,.16)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] text-white/45">الحصة القادمة</p>
          <h2 className="mt-2 text-sm font-bold">{session?.title ?? "لم تجدول حصة"}</h2>
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-sun">
          <Sparkles size={18} />
        </div>
      </div>
      {session ? (
        <>
          <p className="mt-4 text-[10px] text-white/70">
            {formatDateTime(session.starts_at)}
          </p>
          <p className="mt-2 line-clamp-2 text-[8px] leading-5 text-white/45">
            {session.lesson_focus}
          </p>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.07] p-3">
            <span className="text-[8px] text-white/50">
              {session.teacher?.name ?? "المعلم غير معيّن"}
            </span>
            {session.meeting_url ? (
              <button
                type="button"
                onClick={() =>
                  window.open(session.meeting_url ?? "", "_blank", "noopener,noreferrer")
                }
                className="text-[8px] font-semibold text-sun"
              >
                فتح الرابط
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-4 text-[9px] text-white/45">أضف أول حصة من زر الجدولة.</p>
      )}
    </section>
  );
}

function GroupInformation({ cohort }: { cohort: CohortDetail }) {
  return (
    <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy">بيانات التشغيل</h2>
        <StatusBadge
          value={cohort.status}
          label={cohortStatusLabels[cohort.status] ?? cohort.status}
        />
      </div>
      <dl className="mt-5 space-y-4">
        <InfoRow
          icon={<UserRound size={15} />}
          label="المعلم"
          value={cohort.teacher?.name ?? "لم يعيّن"}
        />
        <InfoRow
          icon={<BookOpenCheck size={15} />}
          label="المستوى"
          value={`${cohort.program.name_ar} · ${cohort.level.name_ar}`}
        />
        <InfoRow
          icon={<CalendarDays size={15} />}
          label="الفترة"
          value={`${formatDate(cohort.starts_on)} — ${formatDate(cohort.ends_on)}`}
        />
        <InfoRow
          icon={cohort.delivery_mode === "online" ? <MonitorPlay size={15} /> : <MapPin size={15} />}
          label="مكان الدراسة"
          value={
            cohort.delivery_mode === "online"
              ? "أونلاين"
              : cohort.room_name ?? "لم يحدد"
          }
        />
        <InfoRow
          icon={<GraduationCap size={15} />}
          label="رسوم الطالب"
          value={formatCurrency(cohort.fee)}
        />
      </dl>
      {cohort.schedule?.length ? (
        <div className="mt-5 border-t border-navy/[0.055] pt-4">
          <p className="text-[8px] font-semibold text-slate">الجدول الأسبوعي</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cohort.schedule.map((slot) => (
              <span
                key={`${slot.day}-${slot.time}`}
                className="rounded-lg bg-cloud px-2.5 py-1.5 text-[8px] font-medium text-navy"
              >
                {slot.day} · {slot.time}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CreateSessionDialog({
  cohort,
  open,
  onClose,
}: {
  cohort: CohortDetail;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("90");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + Number(duration) * 60_000);

      return apiClient(`/api/v1/cohorts/${cohort.id}/sessions`, {
        method: "POST",
        json: {
          title,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          lesson_focus: focus || null,
          meeting_url: cohort.delivery_mode === "online" ? cohort.meeting_url : null,
          room_name: cohort.delivery_mode !== "online" ? cohort.room_name : null,
        },
      });
    },
    onSuccess: async () => {
      await invalidateCohort(queryClient, cohort.id);
      setTitle("");
      setStartsAt("");
      setFocus("");
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="جدولة حصة جديدة"
      description="أضف الموعد وهدف الحصة؛ سيظهر مباشرة للمعلم وفريق الإدارة."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogField label="عنوان الحصة">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: الحصة 7 · المحادثة"
            required
          />
        </DialogField>
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="الموعد">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </DialogField>
          <DialogField label="المدة بالدقائق">
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              <option value="60">60 دقيقة</option>
              <option value="90">90 دقيقة</option>
              <option value="120">120 دقيقة</option>
            </select>
          </DialogField>
        </div>
        <DialogField label="هدف ومحتوى الحصة">
          <textarea
            rows={4}
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="ما الذي سيغطيه المعلم؟"
          />
        </DialogField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ الحصة" />
      </form>
    </ActionDialog>
  );
}

function AttendanceDialog({
  cohort,
  session,
  open,
  onClose,
}: {
  cohort: CohortDetail;
  session: ClassSession;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const initialRecords = useMemo(() => {
    return Object.fromEntries(
      cohort.students.map((student) => [
        student.id,
        session.attendance_records.find((record) => record.student.id === student.id)
          ?.status ?? "present",
      ]),
    ) as Record<string, string>;
  }, [cohort.students, session]);
  const [records, setRecords] = useState<Record<string, string>>(initialRecords);
  const [notes, setNotes] = useState(session?.teacher_notes ?? "");
  const [completeSession, setCompleteSession] = useState(session?.status !== "completed");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/class-sessions/${session.id}/attendance`, {
        method: "PUT",
        json: {
          records: cohort.students.map((student) => ({
            student_id: student.id,
            status: records[student.id] ?? "present",
          })),
          complete_session: completeSession,
          teacher_notes: notes || null,
        },
      }),
    onSuccess: async () => {
      await invalidateCohort(queryClient, cohort.id);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="تسجيل الحضور"
      description={`${session.title} · ${formatDateTime(session.starts_at)}`}
      wide
    >
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <div className="flex flex-wrap gap-2 rounded-xl bg-cloud p-3">
          {Object.entries(attendanceLabels).map(([value, label]) => (
            <div key={value} className="flex items-center gap-1.5 text-[8px] text-slate">
              <span
                className={`size-2 rounded-full ${
                  value === "present"
                    ? "bg-emerald-500"
                    : value === "absent"
                      ? "bg-rose-500"
                      : value === "late"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                }`}
              />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-4 divide-y divide-navy/[0.05] overflow-hidden rounded-2xl border border-navy/[0.065]">
          {cohort.students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-mist text-[10px] font-bold text-navy">
                  {student.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-ink">{student.full_name}</p>
                  <p className="mt-1 text-[8px] text-slate">{student.student_code}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(attendanceLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRecords((current) => ({ ...current, [student.id]: value }))
                    }
                    className={`min-h-9 rounded-lg px-2 text-[8px] font-semibold transition ${
                      records[student.id] === value
                        ? value === "present"
                          ? "bg-emerald-600 text-white"
                          : value === "absent"
                            ? "bg-rose-600 text-white"
                            : value === "late"
                              ? "bg-amber-500 text-navy"
                              : "bg-slate-600 text-white"
                        : "border border-navy/[0.07] bg-white text-slate hover:bg-cloud"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <DialogField label="ملاحظات المعلم">
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="ملخص سريع عن الحصة وأداء الجروب..."
            />
          </DialogField>
        </div>

        {session.status !== "completed" ? (
          <label className="mt-4 flex items-center gap-2 text-[9px] font-medium text-navy">
            <input
              type="checkbox"
              checked={completeSession}
              onChange={(event) => setCompleteSession(event.target.checked)}
              className="size-4 accent-teal"
            />
            إنهاء الحصة وتثبيت سجل الحضور
          </label>
        ) : null}

        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ الحضور" />
      </form>
    </ActionDialog>
  );
}

function ProgressDialog({
  cohort,
  student,
  open,
  onClose,
}: {
  cohort: CohortDetail;
  student: CohortStudent;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("general");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [rating, setRating] = useState("good");
  const [feedback, setFeedback] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/students/${student.id}/progress`, {
        method: "POST",
        json: {
          enrollment_id: student.enrollment_id,
          level_id: cohort.level.id,
          type,
          title,
          score: score ? Number(score) : null,
          rating,
          feedback: feedback || null,
          occurred_on: occurredOn,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidateCohort(queryClient, cohort.id),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title={`تقييم ${student.full_name}`}
      description="أضف ملاحظة قابلة للمتابعة تظهر في ملف الطالب ولوحة الجروب."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="نوع التقييم">
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="general">تقييم عام</option>
              <option value="assessment">اختبار</option>
              <option value="speaking">محادثة</option>
              <option value="listening">استماع</option>
              <option value="reading">قراءة</option>
              <option value="writing">كتابة</option>
              <option value="homework">واجب</option>
            </select>
          </DialogField>
          <DialogField label="التاريخ">
            <input
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              required
            />
          </DialogField>
        </div>
        <DialogField label="عنوان التقييم">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: تقييم المحادثة الأسبوعي"
            required
          />
        </DialogField>
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="التقدير">
            <select value={rating} onChange={(event) => setRating(event.target.value)}>
              {Object.entries(ratingLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </DialogField>
          <DialogField label="الدرجة من 100">
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </DialogField>
        </div>
        <DialogField label="ملاحظات وتوجيهات">
          <textarea
            rows={5}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="نقاط القوة وما يحتاج إلى تحسين..."
          />
        </DialogField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ التقييم" />
      </form>
    </ActionDialog>
  );
}

function GenerateScheduleDialog({
  cohort,
  open,
  onClose,
}: {
  cohort: CohortDetail;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(() => dateOffset(1));
  const [to, setTo] = useState(() => {
    const suggested = dateOffset(56);

    return cohort.ends_on && cohort.ends_on < suggested ? cohort.ends_on : suggested;
  });
  const [duration, setDuration] = useState("90");
  const [titlePrefix, setTitlePrefix] = useState("الحصة");
  const [lessonFocus, setLessonFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<ScheduleGenerationResult>>(
        `/api/v1/cohorts/${cohort.id}/generate-sessions`,
        {
          method: "POST",
          json: {
            from,
            to,
            duration_minutes: Number(duration),
            title_prefix: titlePrefix || undefined,
            lesson_focus: lessonFocus || undefined,
          },
        },
      ),
    onSuccess: async (response) => {
      setResult(response.data);
      await Promise.all([
        invalidateCohort(queryClient, cohort.id),
        queryClient.invalidateQueries({ queryKey: ["calendar"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher", "today"] }),
      ]);
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={() => {
        setResult(null);
        setError(null);
        onClose();
      }}
      title="توليد جدول الحصص"
      description="سيحوّل الجدول الأسبوعي المحفوظ إلى حصص فعلية، ويتجاوز الإجازات والمواعيد المكررة تلقائيًا."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setResult(null);
          mutation.mutate();
        }}
      >
        <div className="rounded-2xl bg-cloud p-4">
          <p className="text-[9px] font-semibold text-navy">الجدول الأسبوعي الحالي</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(cohort.schedule ?? []).map((slot) => (
              <span
                key={`${slot.day}-${slot.time}`}
                className="rounded-lg bg-white px-3 py-2 text-[8px] font-semibold text-teal"
              >
                {slot.day} · {slot.time}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="من تاريخ">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              required
            />
          </DialogField>
          <DialogField label="إلى تاريخ">
            <input
              type="date"
              min={from}
              value={to}
              onChange={(event) => setTo(event.target.value)}
              required
            />
          </DialogField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DialogField label="مدة الحصة">
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              <option value="60">60 دقيقة</option>
              <option value="90">90 دقيقة</option>
              <option value="120">120 دقيقة</option>
            </select>
          </DialogField>
          <DialogField label="بادئة اسم الحصة">
            <input
              value={titlePrefix}
              onChange={(event) => setTitlePrefix(event.target.value)}
              placeholder="الحصة"
            />
          </DialogField>
        </div>
        <DialogField label="هدف افتراضي للحصص">
          <textarea
            rows={3}
            value={lessonFocus}
            onChange={(event) => setLessonFocus(event.target.value)}
            placeholder="يمكن للمعلم تخصيصه لاحقًا لكل حصة."
          />
        </DialogField>

        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-bold text-emerald-900">
              تم إنشاء {result.summary.created} حصص
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <ResultStat label="مكررة" value={result.summary.skipped_duplicates} />
              <ResultStat label="إجازات" value={result.summary.skipped_closures} />
              <ResultStat label="تعارضات" value={result.summary.conflicts} />
            </div>
            {result.closures.length ? (
              <p className="mt-3 text-[8px] leading-5 text-emerald-800">
                تم تجاوز: {result.closures.map((closure) => `${closure.name} (${closure.date})`).join("، ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogActions
          error={error}
          pending={mutation.isPending}
          submitLabel={result ? "إعادة الفحص والتوليد" : "توليد الحصص"}
        />
      </form>
    </ActionDialog>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 p-2.5">
      <p className="text-[11px] font-bold text-navy">{value}</p>
      <p className="mt-1 text-[7px] text-slate">{label}</p>
    </div>
  );
}

function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactElement;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className={`fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7 ${
            wide ? "max-w-[820px]" : "max-w-[560px]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] leading-5 text-slate">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogField({ label, children }: { label: string; children: ReactElement }) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-semibold text-navy">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[10px] [&>input]:outline-none [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[10px] [&>select]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:p-3.5 [&>textarea]:text-[10px] [&>textarea]:outline-none">
        {children}
      </span>
    </label>
  );
}

function DialogActions({
  error,
  pending,
  submitLabel,
}: {
  error: string | null;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Dialog.Close asChild>
          <Button variant="secondary">إلغاء</Button>
        </Dialog.Close>
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : submitLabel}
        </Button>
      </div>
    </>
  );
}

function GroupMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] text-slate">{label}</p>
          <p className="mt-2 text-xl font-bold text-navy">{value}</p>
        </div>
        <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-[8px] text-slate">{hint}</p>
    </article>
  );
}

function AttendanceRate({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-cloud">
        <div
          className={`h-full rounded-full ${
            value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-amber-500" : "bg-rose-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[9px] font-bold text-navy">{value}%</span>
    </div>
  );
}

function ProgressBadge({ progress }: { progress: ProgressEntry }) {
  return (
    <div>
      <StatusBadge
        value={progress.rating}
        label={ratingLabels[progress.rating] ?? progress.rating}
      />
      {progress.score ? (
        <p className="mt-1 text-[8px] text-slate">{Number(progress.score)} / 100</p>
      ) : null}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactElement;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-cloud text-teal">
        {icon}
      </div>
      <div className="min-w-0">
        <dt className="text-[8px] text-slate">{label}</dt>
        <dd className="mt-1 truncate text-[9px] font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message;
  }

  return "تعذر حفظ البيانات. حاول مرة أخرى.";
}

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

async function invalidateCohort(
  queryClient: ReturnType<typeof useQueryClient>,
  cohortId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] }),
    queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

function GroupDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-28 rounded-2xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.35fr_.65fr]">
        <div className="h-[620px] rounded-2xl bg-white" />
        <div className="h-[430px] rounded-2xl bg-white" />
      </div>
    </div>
  );
}
