"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddGroupDialog } from "@/features/groups/add-group-dialog";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ApiCollection, Cohort } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ArrowLeft,
  CircleAlert,
  Clock3,
  GraduationCap,
  Hourglass,
  MapPin,
  MonitorPlay,
  RefreshCw,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const cohortStatuses = [
  ["all", "كل الجروبات"],
  ["active", "نشطة الآن"],
  ["enrolling", "متاح التسجيل"],
  ["planned", "مخططة"],
  ["completed", "مكتملة"],
] as const;

const cohortStatusLabels: Record<string, string> = {
  active: "نشط",
  enrolling: "متاح التسجيل",
  planned: "مخطط",
  completed: "مكتمل",
  cancelled: "ملغي",
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

export function GroupsContent() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const query = useQuery({
    queryKey: ["cohorts", status],
    queryFn: () =>
      apiClient<ApiCollection<Cohort>>(
        `/api/v1/cohorts${status === "all" ? "" : `?status=${status}`}`,
      ),
  });

  const groups = query.data?.data ?? [];
  const totalStudents = groups.reduce((sum, group) => sum + group.enrolled_count, 0);
  const totalReserved = groups.reduce((sum, group) => sum + group.reserved_seats, 0);
  const totalWaiting = groups.reduce((sum, group) => sum + group.waitlist_count, 0);
  const openSeats = groups.reduce((sum, group) => sum + group.available_seats, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic Operations · التشغيل الأكاديمي"
        title={isTeacher ? "جروباتي وطلابي" : "الجروبات والحصص"}
        description={
          isTeacher
            ? "الجروبات المسندة إليك فقط، مع الوصول السريع للحضور وتقييمات الطلاب."
            : "صورة واضحة للسعة، مواعيد الدراسة، المعلم المسؤول، ومستوى كل جروب."
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => query.refetch()}>
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              تحديث
            </Button>
            {!isTeacher ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Sparkles size={15} className="text-sun" />
                جروب جديد
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <GroupMetric
          icon={CalendarDays}
          label="الجروبات المعروضة"
          value={groups.length}
          tone="bg-mist text-teal"
        />
        <GroupMetric
          icon={UsersRound}
          label="الطلاب المسجلون"
          value={totalStudents}
          tone="bg-[#edf2fb] text-navy"
        />
        <GroupMetric
          icon={GraduationCap}
          label="مقاعد محجوزة"
          value={totalReserved}
          tone="bg-violet-50 text-violet-700"
        />
        <GroupMetric
          icon={Hourglass}
          label="قوائم الانتظار"
          value={totalWaiting}
          tone="bg-rose-50 text-rose-700"
        />
        <GroupMetric
          icon={CircleAlert}
          label="أماكن متاحة"
          value={openSeats}
          tone="bg-amber-50 text-amber-700"
        />
      </section>

      <section>
        <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-2">
          {cohortStatuses.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`shrink-0 rounded-full px-3.5 py-2.5 text-[12px] font-semibold transition ${
                status === value
                  ? "bg-navy text-white shadow-[0_7px_18px_rgba(11,36,84,.15)]"
                  : "border border-navy/[0.07] bg-white text-slate hover:bg-cloud"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <div className="mt-3 grid animate-pulse gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[330px] rounded-2xl bg-white" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="mt-3 grid min-h-72 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
            <div>
              <CircleAlert className="mx-auto text-rose-500" size={28} />
              <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل الجروبات</p>
              <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
                إعادة المحاولة
              </Button>
            </div>
          </div>
        ) : groups.length ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid min-h-72 place-items-center rounded-2xl border border-navy/[0.065] bg-white p-8 text-center">
            <div>
              <CalendarDays className="mx-auto text-teal" size={30} />
              <p className="mt-3 text-xs font-semibold text-navy">لا توجد جروبات بهذه الحالة</p>
            </div>
          </div>
        )}
      </section>

      {!isTeacher ? (
        <AddGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      ) : null}
    </div>
  );
}

function GroupCard({ group }: { group: Cohort }) {
  const occupancy = group.capacity
    ? Math.min(
        100,
        Math.round(((group.enrolled_count + group.reserved_seats) / group.capacity) * 100),
      )
    : 0;
  const schedule = group.schedule ?? [];

  return (
    <article className="group overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(11,36,84,.08)]">
      <div className="h-1 bg-gradient-to-l from-teal via-teal-bright to-sun" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge
                value={group.status}
                label={cohortStatusLabels[group.status] ?? group.status}
              />
              <span className="font-mono text-[11px] text-slate">{group.code}</span>
            </div>
            <h2 className="mt-3 truncate text-sm font-bold text-navy">{group.name}</h2>
            <p className="mt-1 text-[12px] text-slate">
              {group.program.name_ar} · {group.level.name_ar}
            </p>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mist text-teal">
            {group.delivery_mode === "online" ? (
              <MonitorPlay size={20} />
            ) : (
              <MapPin size={20} />
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-cloud/85 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] text-slate">
              <UsersRound size={13} />
              الإشغال
            </span>
            <span className="text-[12px] font-bold text-navy">
              {group.enrolled_count + group.reserved_seats} / {group.capacity}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full transition-all ${
                occupancy >= 90 ? "bg-rose-500" : occupancy >= 70 ? "bg-sun" : "bg-teal"
              }`}
              style={{ width: `${occupancy}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate">
              {group.enrolled_count} مسجل · {group.reserved_seats} محجوز
            </span>
            <span className={group.available_seats <= 2 ? "font-semibold text-rose-600" : "text-teal"}>
              {group.available_seats} أماكن متاحة
            </span>
          </div>
          {group.waitlist_count ? (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-800">
              <Hourglass size={11} />
              {group.waitlist_count} على قائمة الانتظار
            </div>
          ) : null}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <GroupInfo
            icon={UserRound}
            label="المعلم"
            value={group.teacher?.name ?? "لم يعيّن"}
          />
          <GroupInfo
            icon={CalendarDays}
            label="بداية الدراسة"
            value={formatDate(group.starts_on)}
          />
          <GroupInfo
            icon={Clock3}
            label="المواعيد"
            value={
              schedule.length
                ? schedule
                    .map((slot) => `${dayLabels[slot.day.toLowerCase()] ?? slot.day} ${slot.time}`)
                    .join(" · ")
                : "لم تحدد"
            }
          />
          <GroupInfo
            icon={group.delivery_mode === "online" ? MonitorPlay : MapPin}
            label="نظام الدراسة"
            value={
              group.delivery_mode === "online"
                ? "أونلاين"
                : group.room_name ?? "حضوري"
            }
          />
        </dl>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-navy/[0.055] pt-4">
          <div>
            <p className="text-[11px] text-slate">رسوم الطالب</p>
            <p className="mt-1 text-[13px] font-bold text-navy">{formatCurrency(group.fee)}</p>
          </div>
          <Link
            href={`/groups/${group.id}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-navy px-3 text-[12px] font-semibold text-white transition hover:bg-navy-soft"
          >
            لوحة الجروب
            <ArrowLeft size={13} className="text-sun" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function GroupInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-cloud text-slate">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] text-slate">{label}</dt>
        <dd className="mt-1 line-clamp-2 text-[12px] font-medium leading-4 text-ink">{value}</dd>
      </div>
    </div>
  );
}

function GroupMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-navy">{value}</p>
          <p className="mt-1 text-[12px] text-slate">{label}</p>
        </div>
        <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}
