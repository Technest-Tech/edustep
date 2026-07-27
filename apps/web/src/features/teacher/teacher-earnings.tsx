"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ApiItem, TeacherEarningsData } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  Coins,
  FileClock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  paid: "تم الدفع",
  void: "ملغي",
};

export function TeacherEarnings() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const range = useMemo(() => monthRange(month), [month]);
  const query = useQuery({
    queryKey: ["teacher", "earnings", month],
    queryFn: () =>
      apiClient<ApiItem<TeacherEarningsData>>(
        `/api/v1/teacher/earnings?from=${range.from}&to=${range.to}`,
      ),
  });
  const data = query.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Earnings · شفافية المستحقات"
        title="مستحقاتي"
        description="كل مبلغ مرتبط بحصة مكتملة وطريقة الحساب، مع حالة الاعتماد والدفع."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث
          </Button>
        }
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold text-slate">فترة الاستحقاق</p>
          <p className="mt-1 text-xs font-bold text-navy">
            {new Date(`${month}-01T12:00:00`).toLocaleDateString("ar-EG", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-cloud px-3 py-2">
          <CalendarDays size={16} className="text-teal" />
          <span className="sr-only">شهر الاستحقاق</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="bg-transparent text-[10px] font-semibold text-navy outline-none"
          />
        </label>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <EarningMetric
          icon={Coins}
          label="إجمالي الشهر"
          value={formatCurrency(data?.summary.total ?? 0)}
          hint={`${data?.summary.sessions ?? 0} حصة مكتملة`}
          tone="bg-[#edf2fb] text-navy"
        />
        <EarningMetric
          icon={FileClock}
          label="قيد المراجعة"
          value={formatCurrency(data?.summary.pending ?? 0)}
          hint="تنتظر اعتماد الإدارة"
          tone="bg-amber-50 text-amber-700"
        />
        <EarningMetric
          icon={ShieldCheck}
          label="تم الاعتماد"
          value={formatCurrency(data?.summary.approved ?? 0)}
          hint="جاهز للدفع"
          tone="bg-violet-50 text-violet-700"
        />
        <EarningMetric
          icon={CheckCheck}
          label="تم الدفع"
          value={formatCurrency(data?.summary.paid ?? 0)}
          hint="مبالغ مكتملة"
          tone="bg-emerald-50 text-emerald-700"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-navy/[0.065] bg-white shadow-[0_12px_40px_rgba(11,36,84,.04)]">
        <div className="border-b border-navy/[0.055] p-5 sm:p-6">
          <h2 className="text-sm font-bold text-navy">تفاصيل الحصص والمبالغ</h2>
          <p className="mt-1 text-[9px] text-slate">سجل واضح يمكنك الرجوع إليه في أي وقت</p>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-cloud" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-10 text-center">
            <CircleAlert className="mx-auto text-rose-500" size={26} />
            <p className="mt-3 text-[10px] font-semibold text-navy">تعذر تحميل المستحقات</p>
          </div>
        ) : data?.earnings.length ? (
          <div className="divide-y divide-navy/[0.055]">
            {data.earnings.map((earning) => (
              <article
                key={earning.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cloud text-teal">
                  <Banknote size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold text-navy">
                      {earning.session.cohort?.name}
                    </p>
                    <StatusBadge
                      value={earning.status}
                      label={statusLabels[earning.status] ?? earning.status}
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-slate">{earning.session.title}</p>
                  <p className="mt-2 text-[8px] text-slate/75">
                    {formatDate(earning.earned_on)} · {earning.duration_minutes} دقيقة ·{" "}
                    {earning.rate_type === "hourly" ? "سعر بالساعة" : "سعر للحصة"}
                  </p>
                </div>
                <div className="sm:text-left">
                  <p className="text-base font-bold text-navy">
                    {formatCurrency(earning.amount)}
                  </p>
                  <p className="mt-1 text-[8px] text-slate">
                    السعر المرجعي {formatCurrency(earning.rate_amount)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Coins className="mx-auto text-teal" size={28} />
            <p className="mt-3 text-[10px] font-semibold text-navy">
              لا توجد مستحقات في هذا الشهر
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function EarningMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-base font-bold text-navy">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-slate">{label}</p>
      <p className="mt-1 text-[8px] text-slate/70">{hint}</p>
    </article>
  );
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
