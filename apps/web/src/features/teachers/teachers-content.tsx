"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ApiCollection, ApiItem, Teacher } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Coins,
  GraduationCap,
  Mail,
  Phone,
  RefreshCw,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";

const dayLabels: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

export function TeachersContent() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const query = useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiClient<ApiCollection<Teacher>>("/api/v1/teachers"),
  });
  const teachers = query.data?.data ?? [];
  const students = teachers.reduce((sum, teacher) => sum + teacher.active_students_count, 0);
  const cohorts = teachers.reduce((sum, teacher) => sum + teacher.active_cohorts_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People Operations · فريق التدريس"
        title="المعلمون"
        description="متابعة العبء التدريسي، الجروبات الحالية، التخصص، والتوفر الأسبوعي لكل معلم."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث البيانات
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <TeacherMetric
          icon={UsersRound}
          label="إجمالي المعلمين"
          value={teachers.length}
          tone="bg-mist text-teal"
        />
        <TeacherMetric
          icon={BookOpenCheck}
          label="الجروبات المسندة"
          value={cohorts}
          tone="bg-violet-50 text-violet-700"
        />
        <TeacherMetric
          icon={GraduationCap}
          label="طلاب تحت الإشراف"
          value={students}
          tone="bg-[#edf2fb] text-navy"
        />
      </section>

      {query.isLoading ? (
        <div className="grid animate-pulse gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[390px] rounded-2xl bg-white" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
          <div>
            <CircleAlert className="mx-auto text-rose-500" size={28} />
            <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل بيانات المعلمين</p>
            <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      ) : teachers.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onSelect={() => setSelectedTeacher(teacher)}
            />
          ))}
        </section>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-navy/[0.065] bg-white p-8 text-center">
          <div>
            <UsersRound className="mx-auto text-teal" size={30} />
            <p className="mt-3 text-xs font-semibold text-navy">لم يضف معلمون بعد</p>
          </div>
        </div>
      )}

      <TeacherProfile
        teacher={selectedTeacher}
        open={Boolean(selectedTeacher)}
        onOpenChange={(open) => {
          if (!open) setSelectedTeacher(null);
        }}
      />
    </div>
  );
}

function TeacherCard({
  teacher,
  onSelect,
}: {
  teacher: Teacher;
  onSelect: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-lg font-bold text-white">
            {teacher.name.charAt(0)}
            <span className="absolute -bottom-1 -left-1 size-3.5 rounded-full border-[3px] border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-navy">{teacher.name}</h2>
                <p className="mt-1 text-[9px] text-slate">
                  {teacher.specialization ?? "مدرس لغة إنجليزية"}
                </p>
              </div>
              <StatusBadge
                value={teacher.status}
                label={teacher.status === "active" ? "متاح" : "غير نشط"}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ContactPill icon={Mail} value={teacher.email} />
              {teacher.phone ? <ContactPill icon={Phone} value={teacher.phone} /> : null}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-navy/[0.07] rounded-2xl bg-cloud/85 p-4 text-center">
          <div>
            <p className="text-lg font-bold text-navy">{teacher.active_cohorts_count}</p>
            <p className="mt-1 text-[8px] text-slate">جروبات</p>
          </div>
          <div>
            <p className="text-lg font-bold text-navy">{teacher.active_students_count}</p>
            <p className="mt-1 text-[8px] text-slate">طلاب</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-navy">
              {teacher.hourly_rate ? formatCurrency(teacher.hourly_rate) : "—"}
            </p>
            <p className="mt-2 text-[8px] text-slate">للساعة</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-semibold text-navy">
              <BriefcaseBusiness size={14} className="text-teal" />
              نظام العمل
            </p>
            <p className="mt-2 text-[9px] leading-5 text-slate">
              {teacher.employment_type === "full_time" ? "دوام كامل" : "دوام جزئي"}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-semibold text-navy">
              <Clock3 size={14} className="text-teal" />
              أيام التوفر
            </p>
            <p className="mt-2 text-[9px] leading-5 text-slate">
              {teacher.availability?.map((day) => dayLabels[day] ?? day).join(" · ") ?? "لم تحدد"}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-navy/[0.055] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold text-navy">الجروبات الحالية</p>
            <span className="text-[8px] text-slate">{teacher.cohorts.length} إجمالي</span>
          </div>
          <div className="mt-3 space-y-2">
            {teacher.cohorts.slice(0, 2).map((cohort) => (
              <div
                key={cohort.id}
                className="flex items-center justify-between rounded-xl border border-navy/[0.055] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-medium text-ink">{cohort.name}</p>
                  <p className="mt-1 text-[8px] text-slate">
                    {cohort.level} · {cohort.students_count} طلاب
                  </p>
                </div>
                <UserRoundCheck size={15} className="shrink-0 text-teal" />
              </div>
            ))}
            {!teacher.cohorts.length ? (
              <p className="rounded-xl bg-cloud p-3 text-center text-[9px] text-slate">
                لا توجد جروبات مسندة حاليًا
              </p>
            ) : null}
          </div>
        </div>

        <Button className="mt-5 w-full" variant="secondary" onClick={onSelect}>
          <UserRoundCheck size={15} />
          فتح ملف المعلم
        </Button>
      </div>
    </article>
  );
}

function TeacherProfile({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useQuery({
    queryKey: ["teacher", teacher?.id],
    queryFn: () => apiClient<ApiItem<Teacher>>(`/api/v1/teachers/${teacher!.id}`),
    enabled: Boolean(teacher && open),
  });

  if (!teacher) return null;

  const profile = query.data?.data ?? teacher;
  const metrics = profile.operational_metrics;
  const upcomingSessions =
    profile.sessions
      ?.filter((session) => session.status === "scheduled")
      .sort(
        (first, second) =>
          new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime(),
      )
      .slice(0, 5) ?? [];
  const recentEarnings = profile.earnings?.slice(0, 6) ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 w-full max-w-[620px] overflow-y-auto border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-xl font-bold text-white">
                {profile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <Dialog.Title className="truncate text-lg font-bold text-navy">
                  {profile.name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[9px] text-slate">
                  {profile.specialization ?? "مدرس لغة إنجليزية"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق ملف المعلم">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ContactPill icon={Mail} value={profile.email} />
            {profile.phone ? <ContactPill icon={Phone} value={profile.phone} /> : null}
            <StatusBadge
              value={profile.status}
              label={profile.status === "active" ? "متاح للعمل" : "غير نشط"}
            />
          </div>

          {query.isLoading ? (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-28 rounded-2xl bg-cloud" />
              <div className="h-56 rounded-2xl bg-cloud" />
            </div>
          ) : (
            <>
              <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TeacherDetailMetric
                  icon={CheckCircle2}
                  label="حصص مكتملة"
                  value={metrics?.completed_sessions ?? 0}
                />
                <TeacherDetailMetric
                  icon={CalendarClock}
                  label="حصص قادمة"
                  value={metrics?.upcoming_sessions ?? 0}
                />
                <TeacherDetailMetric
                  icon={TrendingUp}
                  label="اكتمال التقارير"
                  value={`${metrics?.report_completion_rate ?? 0}%`}
                />
                <TeacherDetailMetric
                  icon={WalletCards}
                  label="مستحق الشهر"
                  value={formatCurrency(metrics?.month_earnings ?? 0)}
                  small
                />
              </section>

              <section className="mt-5 rounded-2xl bg-navy p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] text-teal-bright">النبذة ونظام العمل</p>
                    <h2 className="mt-1 text-sm font-bold">
                      {profile.employment_type === "full_time" ? "دوام كامل" : "دوام جزئي"}
                    </h2>
                  </div>
                  <BriefcaseBusiness size={20} className="text-sun" />
                </div>
                <p className="mt-4 text-[9px] leading-5 text-white/65">
                  {profile.bio ?? "لم تتم إضافة نبذة مهنية بعد."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.availability?.map((day) => (
                    <span
                      key={day}
                      className="rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[8px] text-white/75"
                    >
                      {dayLabels[day] ?? day}
                    </span>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-navy">الجدول القادم</h2>
                    <p className="mt-1 text-[8px] text-slate">أقرب الحصص المسندة للمعلم</p>
                  </div>
                  <CalendarClock size={17} className="text-teal" />
                </div>
                <div className="mt-4 space-y-2">
                  {upcomingSessions.map((session) => (
                    <article
                      key={session.id}
                      className="flex items-center gap-3 rounded-xl bg-cloud/75 p-3"
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-teal">
                        <Clock3 size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold text-navy">
                          {session.cohort.name}
                        </p>
                        <p className="mt-1 text-[8px] text-slate">
                          {formatDateTime(session.starts_at)}
                        </p>
                      </div>
                      <StatusBadge value="scheduled" label="مجدولة" />
                    </article>
                  ))}
                  {!upcomingSessions.length ? (
                    <p className="rounded-xl bg-cloud p-4 text-center text-[9px] text-slate">
                      لا توجد حصص قادمة ضمن البيانات الحالية.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-navy/[0.065] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-navy">آخر المستحقات</h2>
                    <p className="mt-1 text-[8px] text-slate">
                      مبالغ محسوبة تلقائيًا من الحصص المكتملة
                    </p>
                  </div>
                  <Coins size={17} className="text-teal" />
                </div>
                <div className="mt-4 space-y-2">
                  {recentEarnings.map((earning) => (
                    <article
                      key={earning.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-navy/[0.055] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-semibold text-navy">
                          {earning.session.cohort}
                        </p>
                        <p className="mt-1 text-[8px] text-slate">
                          {formatDateTime(`${earning.earned_on}T12:00:00`)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-navy">
                          {formatCurrency(earning.amount)}
                        </p>
                        <StatusBadge
                          value={earning.status}
                          label={
                            earning.status === "pending"
                              ? "قيد المراجعة"
                              : earning.status === "approved"
                                ? "معتمد"
                                : "مدفوع"
                          }
                          className="mt-1"
                        />
                      </div>
                    </article>
                  ))}
                  {!recentEarnings.length ? (
                    <p className="rounded-xl bg-cloud p-4 text-center text-[9px] text-slate">
                      لا توجد مستحقات مسجلة حتى الآن.
                    </p>
                  ) : null}
                </div>
              </section>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TeacherDetailMetric({
  icon: Icon,
  label,
  value,
  small = false,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <article className="rounded-2xl bg-cloud/80 p-3">
      <Icon size={16} className="text-teal" />
      <p className={`mt-3 truncate font-bold text-navy ${small ? "text-[10px]" : "text-base"}`}>
        {value}
      </p>
      <p className="mt-1 text-[7px] text-slate">{label}</p>
    </article>
  );
}

function ContactPill({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <span dir="ltr" className="inline-flex items-center gap-1.5 rounded-lg bg-cloud px-2.5 py-1.5 text-[8px] text-slate">
      <Icon size={12} />
      {value}
    </span>
  );
}

function TeacherMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
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
        <p className="mt-1 text-[9px] text-slate">{label}</p>
      </div>
    </article>
  );
}
