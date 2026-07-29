"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatDate, relativeTime } from "@/lib/format";
import type { ApiItem, DashboardData } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  MessageCircleMore,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const metricConfig = [
  {
    key: "open_leads",
    label: "عملاء قيد المتابعة",
    icon: MessageCircleMore,
    hint: "كل الفرص المفتوحة",
    tone: "bg-mist text-teal",
  },
  {
    key: "active_students",
    label: "الطلاب النشطون",
    icon: GraduationCap,
    hint: "مسجلون في الأكاديمية",
    tone: "bg-[#edf2fb] text-navy",
  },
  {
    key: "active_cohorts",
    label: "الجروبات النشطة",
    icon: UsersRound,
    hint: "تعمل حاليًا",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    key: "pending_follow_ups",
    label: "متابعات مطلوبة",
    icon: CircleAlert,
    hint: "تحتاج إجراء من الفريق",
    tone: "bg-amber-50 text-amber-700",
  },
] as const;

export function DashboardContent() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiClient<ApiItem<DashboardData>>("/api/v1/dashboard"),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <CircleAlert className="mx-auto text-rose-500" size={28} />
        <h1 className="mt-4 text-lg font-bold text-navy">تعذر تحميل لوحة الإدارة</h1>
        <p className="mt-2 text-xs text-slate">تأكد أن Laravel API يعمل ثم حاول مجددًا.</p>
        <Button className="mt-5" onClick={() => refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const dashboard = data.data;
  const maxFunnel = Math.max(...dashboard.funnel.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        title="صباح الخير، هذه صورة الأكاديمية اليوم"
        description="الأرقام محدثة من قاعدة البيانات وتجمع أهم ما يحتاج قرارًا أو متابعة."
        actions={
          <>
            <Button variant="secondary" onClick={() => refetch()}>
              تحديث البيانات
            </Button>
            <Button onClick={() => router.push("/leads")}>
              <UserPlus size={16} className="text-sun" />
              إضافة عميل
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;
          const value = dashboard.metrics[metric.key];

          return (
            <article
              key={metric.key}
              className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-slate">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-navy">
                    {value}
                  </p>
                </div>
                <div className={`grid size-11 place-items-center rounded-2xl ${metric.tone}`}>
                  <Icon size={21} strokeWidth={1.9} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-navy/[0.055] pt-3">
                <span className="text-[12px] text-slate">{metric.hint}</span>
                {metric.key === "pending_follow_ups" ? (
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600">
                    {dashboard.metrics.overdue_follow_ups} متأخرة
                  </span>
                ) : metric.key === "open_leads" ? (
                  <span className="rounded-full bg-teal/10 px-2 py-1 text-[11px] font-bold text-navy">
                    {dashboard.metrics.new_leads} جديدة
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-5 2xl:grid-cols-[1.35fr_.85fr]">
        <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_28px_rgba(11,36,84,.035)]">
          <div className="flex items-center justify-between border-b border-navy/[0.055] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy">متابعات تحتاج إجراء</h2>
              <p className="mt-1 text-[12px] text-slate">مرتبة حسب الموعد والأولوية</p>
            </div>
            <Link
              href="/leads?overdue=1"
              className="flex items-center gap-1 text-[12px] font-semibold text-teal"
            >
              عرض CRM
              <ArrowLeft size={13} />
            </Link>
          </div>

          {dashboard.today_follow_ups.length ? (
            <div className="divide-y divide-navy/[0.05]">
              {dashboard.today_follow_ups.map((followUp) => (
                <Link
                  key={followUp.id}
                  href={`/leads/${followUp.lead?.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-cloud/75 sm:grid-cols-[minmax(0,1fr)_130px_100px] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {followUp.lead?.full_name}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-slate">
                      {followUp.subject}
                    </p>
                  </div>
                  <p
                    className={`text-[12px] font-medium ${
                      followUp.is_overdue ? "text-rose-600" : "text-slate"
                    }`}
                  >
                    {relativeTime(followUp.due_at)}
                  </p>
                  <span className="text-left text-[12px] text-slate">
                    {followUp.assignee?.name ?? "غير معيّن"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center px-5 text-center">
              <div>
                <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
                <p className="mt-3 text-xs font-semibold text-navy">
                  كل المتابعات تحت السيطرة
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">مسار التحويل</h2>
              <p className="mt-1 text-[12px] text-slate">توزيع العملاء على المراحل</p>
            </div>
            <div className="grid size-9 place-items-center rounded-xl bg-mist text-teal">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard.funnel.map((stage) => (
              <div key={stage.status}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate">{stage.label}</span>
                  <span className="text-[12px] font-bold text-navy">{stage.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cloud">
                  <div
                    className="h-full min-w-1 rounded-full bg-teal transition-all"
                    style={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-navy p-4 text-white">
            <p className="text-[12px] text-white/55">نسبة التحويل الكلية</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-2xl font-bold">{dashboard.metrics.conversion_rate}%</p>
              <Sparkles className="text-sun" size={19} />
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">أحدث العملاء</h2>
              <p className="mt-1 text-[12px] text-slate">آخر فرص دخلت للنظام</p>
            </div>
            <Link href="/leads" className="text-[12px] font-semibold text-teal">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-2">
            {dashboard.recent_leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-3 rounded-xl border border-navy/[0.05] px-3 py-3 transition hover:border-teal/20 hover:bg-cloud/60"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-mist text-[12px] font-bold text-navy">
                  {lead.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {lead.full_name}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-slate">
                    {lead.program?.name_ar ?? "البرنامج غير محدد"} · {lead.source.label}
                  </p>
                </div>
                <StatusBadge value={lead.status.value} label={lead.status.label} />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">الجروبات الحالية</h2>
              <p className="mt-1 text-[12px] text-slate">السعة والبداية والمعلم</p>
            </div>
            <Link href="/groups" className="text-[12px] font-semibold text-teal">
              إدارة الجروبات
            </Link>
          </div>
          <div className="space-y-2">
            {dashboard.cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href="/groups"
                className="flex items-center gap-3 rounded-xl border border-navy/[0.05] px-3 py-3 transition hover:border-teal/20 hover:bg-cloud/60"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf2fb] text-navy">
                  <CalendarDays size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">{cohort.name}</p>
                  <p className="mt-1 truncate text-[11px] text-slate">
                    {cohort.teacher?.name ?? "لم يُعيّن معلم"} · يبدأ {formatDate(cohort.starts_on)}
                  </p>
                </div>
                <span className="text-[12px] font-bold text-navy">
                  {cohort.enrolled_count}/{cohort.capacity}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-2xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-40 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-96 rounded-2xl bg-white" />
        <div className="h-96 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
