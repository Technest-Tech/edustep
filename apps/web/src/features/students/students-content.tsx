"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ApiCollection, ApiItem, Student } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useDeferredValue, useState } from "react";

const studentStatuses = [
  ["all", "كل الطلاب"],
  ["active", "نشط"],
  ["paused", "موقوف مؤقتًا"],
  ["graduated", "متخرج"],
  ["inactive", "غير نشط"],
] as const;

const studentStatusLabels: Record<string, string> = {
  active: "نشط",
  paused: "موقوف مؤقتًا",
  graduated: "متخرج",
  inactive: "غير نشط",
};

const progressRatingLabels: Record<string, string> = {
  needs_improvement: "يحتاج تحسين",
  developing: "في تطور",
  good: "جيد",
  excellent: "ممتاز",
};

export function StudentsContent({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({
    queryKey: ["students", deferredSearch, status, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "15",
      });
      if (deferredSearch) params.set("search", deferredSearch);
      if (status !== "all") params.set("status", status);

      return apiClient<ApiCollection<Student>>(`/api/v1/students?${params}`);
    },
  });

  const students = query.data?.data ?? [];
  const activeInPage = students.filter((student) => student.status === "active").length;
  const enrolledInPage = students.filter((student) =>
    student.enrollments?.some((enrollment) => enrollment.status === "active"),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student 360 · الملف الأكاديمي"
        title="الطلاب"
        description="ملف موحد لكل طالب يجمع بيانات التواصل، الجروب الحالي، المستوى، والبيانات المالية."
        actions={
          <Button onClick={() => window.location.assign("/leads")}>
            <Sparkles size={15} className="text-sun" />
            تسجيل طالب من CRM
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StudentMetric
          icon={GraduationCap}
          label="إجمالي النتائج"
          value={query.data?.meta?.total ?? 0}
          tone="bg-mist text-teal"
        />
        <StudentMetric
          icon={UsersRound}
          label="نشط في الصفحة"
          value={activeInPage}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StudentMetric
          icon={BookOpenCheck}
          label="لديهم تسجيل حالي"
          value={enrolledInPage}
          tone="bg-violet-50 text-violet-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
        <div className="border-b border-navy/[0.055] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud/70 px-3.5 text-slate">
              <Search size={17} />
              <span className="sr-only">البحث في الطلاب</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث بالاسم، كود الطالب، أو رقم الهاتف..."
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
              />
            </label>
            <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
              {studentStatuses.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
                    status === value
                      ? "bg-navy text-white shadow-sm"
                      : "border border-navy/[0.07] bg-white text-slate hover:bg-cloud"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <StudentTableSkeleton />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : students.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-cloud/55 text-right text-[12px] font-semibold text-slate">
                    <th className="px-5 py-3.5">الطالب</th>
                    <th className="px-4 py-3.5">الحالة</th>
                    <th className="px-4 py-3.5">الجروب الحالي</th>
                    <th className="px-4 py-3.5">المستوى</th>
                    <th className="px-4 py-3.5">تاريخ الانضمام</th>
                    <th className="px-5 py-3.5 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {students.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onSelect={() => setSelectedStudent(student)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-navy/[0.05] md:hidden">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onSelect={() => setSelectedStudent(student)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <GraduationCap className="mx-auto text-teal" size={30} />
              <p className="mt-3 text-xs font-semibold text-navy">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-[12px] text-slate">غيّر عبارة البحث أو حالة الطالب.</p>
            </div>
          </div>
        )}

        {query.data?.meta && query.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-navy/[0.055] px-5 py-4">
            <p className="text-[12px] text-slate">
              عرض {query.data.meta.from}–{query.data.meta.to} من {query.data.meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight size={15} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                disabled={page >= query.data.meta.last_page}
                onClick={() => setPage((value) => value + 1)}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft size={15} />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <StudentProfile
        student={selectedStudent}
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      />
    </div>
  );
}

function StudentRow({
  student,
  onSelect,
}: {
  student: Student;
  onSelect: () => void;
}) {
  const enrollment = currentEnrollment(student);

  return (
    <tr className="transition hover:bg-cloud/60">
      <td className="px-5 py-4">
        <button type="button" onClick={onSelect} className="flex items-center gap-3 text-right">
          <Avatar name={student.full_name} />
          <div className="min-w-0">
            <p className="max-w-48 truncate text-[13px] font-semibold text-ink">
              {student.full_name}
            </p>
            <p className="mt-1 font-mono text-[12px] text-slate">{student.student_code}</p>
          </div>
        </button>
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          value={student.status}
          label={studentStatusLabels[student.status] ?? student.status}
        />
      </td>
      <td className="px-4 py-4 text-[12px] font-medium text-ink">
        {enrollment?.cohort?.name ?? "غير مسجل"}
      </td>
      <td className="px-4 py-4 text-[12px] text-slate">
        {enrollment?.cohort?.level?.name_ar ?? "—"}
      </td>
      <td className="px-4 py-4 text-[12px] text-slate">{formatDate(student.joined_on)}</td>
      <td className="px-5 py-4 text-left">
        <Button variant="ghost" size="sm" onClick={onSelect}>
          عرض الملف
          <ChevronLeft size={14} />
        </Button>
      </td>
    </tr>
  );
}

function StudentCard({ student, onSelect }: { student: Student; onSelect: () => void }) {
  const enrollment = currentEnrollment(student);

  return (
    <button type="button" onClick={onSelect} className="w-full p-4 text-right transition hover:bg-cloud">
      <div className="flex items-start gap-3">
        <Avatar name={student.full_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="truncate text-[13px] font-semibold text-ink">{student.full_name}</p>
              <p className="mt-1 font-mono text-[12px] text-slate">{student.student_code}</p>
            </div>
            <StatusBadge
              value={student.status}
              label={studentStatusLabels[student.status] ?? student.status}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-cloud/80 p-3">
            <div>
              <p className="text-[11px] text-slate">الجروب</p>
              <p className="mt-1 truncate text-[12px] font-medium text-navy">
                {enrollment?.cohort?.name ?? "غير مسجل"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate">المستوى</p>
              <p className="mt-1 truncate text-[12px] font-medium text-navy">
                {enrollment?.cohort?.level?.name_ar ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function StudentProfile({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["student", student?.id],
    queryFn: () => apiClient<ApiItem<Student>>(`/api/v1/students/${student!.id}`),
    enabled: Boolean(student && open),
  });

  if (!student) return null;

  const profile = detailQuery.data?.data ?? student;
  const enrollment = currentEnrollment(profile);
  const attendance = profile.attendance_summary;
  const progress = profile.progress_entries ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 w-full max-w-[520px] overflow-y-auto border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-xl font-bold text-white">
                {profile.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <Dialog.Title className="truncate text-lg font-bold text-navy">
                  {profile.full_name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 font-mono text-[12px] text-slate">
                  {profile.student_code}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق ملف الطالب">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-cloud p-4">
            <span className="text-[12px] font-medium text-slate">حالة الطالب</span>
            <StatusBadge
              value={profile.status}
              label={studentStatusLabels[profile.status] ?? profile.status}
            />
          </div>

          <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
            <h2 className="flex items-center gap-2 text-xs font-bold text-navy">
              <UserRound size={16} className="text-teal" />
              بيانات التواصل
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <ProfileItem label="رقم الهاتف" value={profile.phone} dir="ltr" />
              <ProfileItem label="البريد الإلكتروني" value={profile.email ?? "—"} dir="ltr" />
              <ProfileItem label="ولي الأمر" value={profile.guardian_name ?? "—"} />
              <ProfileItem label="هاتف ولي الأمر" value={profile.guardian_phone ?? "—"} dir="ltr" />
            </dl>
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl bg-navy p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-white/50">التسجيل الحالي</p>
                <h2 className="mt-1 text-sm font-bold">
                  {enrollment?.cohort?.name ?? "لا يوجد تسجيل نشط"}
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-white/10 text-sun">
                <BookOpenCheck size={19} />
              </div>
            </div>
            {enrollment ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <ProfileItem
                    light
                    label="المستوى"
                    value={enrollment.cohort?.level?.name_ar ?? "—"}
                  />
                  <ProfileItem
                    light
                    label="تاريخ التسجيل"
                    value={formatDate(enrollment.enrolled_on)}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.07] p-3">
                  <span className="text-[12px] text-white/55">صافي الرسوم</span>
                  <span className="text-xs font-bold text-sun">
                    {formatCurrency(enrollment.net_amount)}
                  </span>
                </div>
              </>
            ) : null}
          </section>

          {detailQuery.isLoading ? (
            <div className="mt-5 h-32 animate-pulse rounded-2xl bg-cloud" />
          ) : attendance ? (
            <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold text-navy">
                  <CalendarCheck2 size={16} className="text-teal" />
                  انتظام الحضور
                </h2>
                <span
                  className={`text-lg font-bold ${
                    attendance.rate >= 80 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {attendance.rate}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-cloud">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-teal to-emerald-500"
                  style={{ width: `${Math.min(attendance.rate, 100)}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-cloud p-3">
                  <p className="text-[11px] text-slate">الحصص المسجلة</p>
                  <p className="mt-1 text-sm font-bold text-navy">{attendance.records}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-[11px] text-rose-600">مرات الغياب</p>
                  <p className="mt-1 text-sm font-bold text-rose-700">{attendance.absences}</p>
                </div>
              </div>
            </section>
          ) : null}

          {!detailQuery.isLoading ? (
            <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold text-navy">
                  <TrendingUp size={16} className="text-teal" />
                  سجل التقدم والتقييمات
                </h2>
                <span className="rounded-full bg-cloud px-2.5 py-1 text-[12px] font-bold text-navy">
                  {progress.length}
                </span>
              </div>
              {progress.length ? (
                <div className="mt-4 space-y-3">
                  {progress.slice(0, 6).map((entry) => (
                    <article
                      key={entry.id}
                      className="relative rounded-xl border border-navy/[0.055] bg-cloud/55 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold text-navy">
                            {entry.title}
                          </p>
                          <p className="mt-1 text-[11px] text-slate">
                            {formatDate(entry.occurred_on)}
                            {entry.evaluator ? ` · ${entry.evaluator.name}` : ""}
                          </p>
                        </div>
                        <StatusBadge
                          value={entry.rating}
                          label={progressRatingLabels[entry.rating] ?? entry.rating}
                        />
                      </div>
                      {entry.feedback ? (
                        <p className="mt-3 text-[12px] leading-5 text-slate">{entry.feedback}</p>
                      ) : null}
                      {entry.score ? (
                        <span className="mt-3 inline-flex rounded-lg bg-white px-2 py-1 font-mono text-[12px] font-bold text-teal">
                          {Number(entry.score)} / 100
                        </span>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-cloud p-5 text-center">
                  <p className="text-[12px] font-semibold text-navy">لا توجد تقييمات بعد</p>
                  <p className="mt-1 text-[11px] text-slate">
                    يمكن إضافة التقييم من لوحة الجروب.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.assign(`tel:${profile.phone}`)}
            >
              <Phone size={15} />
              اتصال
            </Button>
            <Button
              onClick={() =>
                window.open(
                  `https://wa.me/${profile.phone.replace(/\D/g, "")}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <MessageCircle size={15} className="text-sun" />
              WhatsApp
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StudentMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-navy">{value}</p>
        <p className="mt-1 text-[12px] text-slate">{label}</p>
      </div>
    </article>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-[13px] font-bold text-navy">
      {name.charAt(0)}
    </div>
  );
}

function ProfileItem({
  label,
  value,
  dir,
  light = false,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  light?: boolean;
}) {
  return (
    <div>
      <dt className={`text-[11px] ${light ? "text-white/45" : "text-slate"}`}>{label}</dt>
      <dd
        dir={dir}
        className={`mt-1 truncate text-[12px] font-medium ${
          light ? "text-white" : "text-ink"
        } ${dir === "ltr" ? "text-right" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function currentEnrollment(student: Student) {
  return (
    student.enrollments?.find((enrollment) => enrollment.status === "active") ??
    student.enrollments?.[0]
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div>
        <CircleAlert className="mx-auto text-rose-500" size={28} />
        <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل الطلاب</p>
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}

function StudentTableSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 rounded-xl bg-cloud" />
        ))}
      </div>
    </div>
  );
}
