"use client";

import { AddLeadDialog } from "@/features/leads/add-lead-dialog";
import { LeadPipelineBoard } from "@/features/leads/lead-pipeline-board";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { relativeTime } from "@/lib/format";
import type { ApiCollection, ApiItem, Lead, LeadPipeline } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Columns3,
  Filter,
  List,
  MessageCircleMore,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

const stages = [
  ["all", "كل العملاء"],
  ["new", "جديد"],
  ["contacted", "تم التواصل"],
  ["qualified", "مؤهل"],
  ["assessment_scheduled", "اختبار مستوى"],
  ["trial_scheduled", "حصة تجريبية"],
  ["won", "تم التسجيل"],
  ["lost", "غير مهتم"],
] as const;

type ViewMode = "pipeline" | "list";

export function LeadsContent({
  initialSearch = "",
  initialOverdue = false,
}: {
  initialSearch?: string;
  initialOverdue?: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>("pipeline");
  const [search, setSearch] = useState(initialSearch);
  const [stage, setStage] = useState("all");
  const [overdue, setOverdue] = useState(initialOverdue);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useQuery({
    queryKey: ["leads", "list", deferredSearch, stage, overdue, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "15",
      });
      if (deferredSearch) params.set("search", deferredSearch);
      if (stage !== "all") params.set("status", stage);
      if (overdue) params.set("overdue", "1");

      return apiClient<ApiCollection<Lead>>(`/api/v1/leads?${params}`);
    },
    enabled: activeView === "list",
  });

  const pipelineQueryKey = [
    "leads",
    "pipeline",
    deferredSearch,
    overdue,
  ] as const;
  const pipelineQuery = useQuery({
    queryKey: pipelineQueryKey,
    queryFn: () => {
      const params = new URLSearchParams({ limit_per_stage: "50" });
      if (deferredSearch) params.set("search", deferredSearch);
      if (overdue) params.set("overdue", "1");

      return apiClient<ApiItem<LeadPipeline>>(`/api/v1/leads/pipeline?${params}`);
    },
    enabled: activeView === "pipeline",
  });

  const moveMutation = useMutation({
    mutationFn: ({ lead, status }: { lead: Lead; status: string }) =>
      apiClient<ApiItem<Lead>>(`/api/v1/leads/${lead.id}`, {
        method: "PATCH",
        json: { status },
      }),
    onMutate: async ({ lead, status }) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: pipelineQueryKey });
      const previous = queryClient.getQueryData<ApiItem<LeadPipeline>>(pipelineQueryKey);

      if (previous) {
        queryClient.setQueryData(
          pipelineQueryKey,
          optimisticallyMoveLead(previous, lead, status),
        );
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pipelineQueryKey, context.previous);
      }
      setActionError(errorMessage(error));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  function moveLead(lead: Lead, status: string) {
    if (moveMutation.isPending || lead.status.value === status) return;

    if (status === "won") {
      setActionError(
        "مرحلة «تم التسجيل» تحتاج تحويل العميل إلى طالب من ملفه حتى يتم إنشاء التسجيل والفاتورة بصورة صحيحة.",
      );
      return;
    }

    if (lead.status.value === "won") {
      setActionError("العميل المسجل مرحلة مكتملة ولا يمكن نقله من لوحة المسار.");
      return;
    }

    moveMutation.mutate({ lead, status });
  }

  const pipelineLeads =
    pipelineQuery.data?.data.columns.flatMap((column) => column.leads) ?? [];
  const visibleLeads =
    activeView === "pipeline" ? pipelineLeads : (listQuery.data?.data ?? []);
  const total =
    activeView === "pipeline"
      ? (pipelineQuery.data?.data.total ?? 0)
      : (listQuery.data?.meta?.total ?? 0);
  const followUpsVisible = visibleLeads.filter((lead) => lead.next_follow_up).length;
  const overdueVisible = visibleLeads.filter(
    (lead) => lead.next_follow_up?.is_overdue,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM · إدارة رحلة التسجيل"
        title="العملاء والمتابعات"
        description="كل محادثة وموعد وخطوة تالية في سجل واضح، من أول رسالة حتى التسجيل."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="text-sun" />
            إضافة عميل
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniMetric
          icon={UsersRound}
          label="نتائج البحث"
          value={total}
          tone="bg-mist text-teal"
        />
        <MiniMetric
          icon={MessageCircleMore}
          label="تحتاج متابعة ظاهرة"
          value={followUpsVisible}
          tone="bg-violet-50 text-violet-700"
        />
        <MiniMetric
          icon={CircleAlert}
          label="متابعات متأخرة ظاهرة"
          value={overdueVisible}
          tone="bg-rose-50 text-rose-600"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
        <div className="border-b border-navy/[0.055] p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud/70 px-3.5 text-slate">
              <Search size={17} />
              <span className="sr-only">البحث في العملاء</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث بالاسم أو الهاتف أو البريد..."
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="اختيار طريقة عرض العملاء"
                className="flex rounded-xl border border-navy/[0.08] bg-cloud/70 p-1"
              >
                <button
                  type="button"
                  aria-pressed={activeView === "pipeline"}
                  onClick={() => {
                    setActiveView("pipeline");
                    setActionError(null);
                  }}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition ${
                    activeView === "pipeline"
                      ? "bg-navy text-white shadow-sm"
                      : "text-slate hover:bg-white hover:text-navy"
                  }`}
                >
                  <Columns3 size={14} />
                  مسار
                </button>
                <button
                  type="button"
                  aria-pressed={activeView === "list"}
                  onClick={() => {
                    setActiveView("list");
                    setActionError(null);
                  }}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition ${
                    activeView === "list"
                      ? "bg-navy text-white shadow-sm"
                      : "text-slate hover:bg-white hover:text-navy"
                  }`}
                >
                  <List size={14} />
                  قائمة
                </button>
              </div>

              <Button
                variant={overdue ? "danger" : "secondary"}
                onClick={() => {
                  setOverdue((value) => !value);
                  setPage(1);
                }}
              >
                <CircleAlert size={15} />
                المتأخرة فقط
              </Button>
            </div>
          </div>

          {activeView === "list" ? (
            <div className="thin-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {stages.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStage(value);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold transition ${
                    stage === value
                      ? "bg-navy text-white shadow-sm"
                      : "border border-navy/[0.07] bg-white text-slate hover:bg-cloud"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal/10 bg-mist/45 px-3.5 py-2.5">
              <p className="text-[11px] leading-5 text-slate">
                عرض المسار هو العرض الافتراضي؛ كل عمود يمثل مرحلة من رحلة التسجيل.
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-teal shadow-sm">
                <span className="size-1.5 rounded-full bg-teal" />
                تحديث حي
              </span>
            </div>
          )}
        </div>

        {actionError ? (
          <div className="flex items-start justify-between gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3 text-rose-700 sm:px-5">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 shrink-0" size={15} />
              <p className="text-[12px] leading-5">{actionError}</p>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="grid size-7 shrink-0 place-items-center rounded-lg transition hover:bg-rose-100"
              aria-label="إغلاق التنبيه"
            >
              <X size={13} />
            </button>
          </div>
        ) : null}

        {activeView === "pipeline" ? (
          pipelineQuery.isLoading ? (
            <PipelineSkeleton />
          ) : pipelineQuery.isError || !pipelineQuery.data ? (
            <QueryError onRetry={() => pipelineQuery.refetch()} />
          ) : (
            <LeadPipelineBoard
              columns={pipelineQuery.data.data.columns}
              movingLeadId={
                moveMutation.isPending ? (moveMutation.variables?.lead.id ?? null) : null
              }
              onMove={moveLead}
            />
          )
        ) : listQuery.isLoading ? (
          <TableSkeleton />
        ) : listQuery.isError ? (
          <QueryError onRetry={() => listQuery.refetch()} />
        ) : listQuery.data?.data.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="bg-cloud/55 text-right text-[12px] font-semibold text-slate">
                    <th className="px-5 py-3.5">العميل</th>
                    <th className="px-4 py-3.5">المرحلة</th>
                    <th className="px-4 py-3.5">المصدر والبرنامج</th>
                    <th className="px-4 py-3.5">المتابعة التالية</th>
                    <th className="px-4 py-3.5">المسؤول</th>
                    <th className="px-5 py-3.5 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {listQuery.data.data.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-navy/[0.05] md:hidden">
              {listQuery.data.data.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <Filter className="mx-auto text-teal" size={28} />
              <p className="mt-3 text-xs font-semibold text-navy">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-[12px] text-slate">جرّب تغيير البحث أو المرحلة.</p>
            </div>
          </div>
        )}

        {activeView === "list" &&
        listQuery.data?.meta &&
        listQuery.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-navy/[0.055] px-5 py-4">
            <p className="text-[12px] text-slate">
              عرض {listQuery.data.meta.from}–{listQuery.data.meta.to} من{" "}
              {listQuery.data.meta.total}
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
                disabled={page >= listQuery.data.meta.last_page}
                onClick={() => setPage((value) => value + 1)}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft size={15} />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <AddLeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="group transition hover:bg-cloud/60">
      <td className="px-5 py-4">
        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-[13px] font-bold text-navy">
            {lead.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="max-w-48 truncate text-[13px] font-semibold text-ink">
              {lead.full_name}
            </p>
            <p dir="ltr" className="mt-1 text-right text-[12px] text-slate">
              {lead.phone}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-4">
        <StatusBadge value={lead.status.value} label={lead.status.label} />
      </td>
      <td className="px-4 py-4">
        <p className="text-[12px] font-medium text-ink">{lead.source.label}</p>
        <p className="mt-1 text-[11px] text-slate">{lead.program?.name_ar ?? "غير محدد"}</p>
      </td>
      <td className="px-4 py-4">
        {lead.next_follow_up ? (
          <div>
            <p
              className={`max-w-44 truncate text-[12px] font-medium ${
                lead.next_follow_up.is_overdue ? "text-rose-600" : "text-ink"
              }`}
            >
              {lead.next_follow_up.subject}
            </p>
            <p className="mt-1 text-[11px] text-slate">
              {relativeTime(lead.next_follow_up.due_at)}
            </p>
          </div>
        ) : (
          <span className="text-[12px] text-slate/60">لا توجد متابعة</span>
        )}
      </td>
      <td className="px-4 py-4 text-[12px] text-slate">
        {lead.owner?.name ?? "غير معيّن"}
      </td>
      <td className="px-5 py-4 text-left">
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-semibold text-teal transition hover:bg-mist hover:text-navy"
        >
          فتح الملف
          <ChevronLeft size={13} />
        </Link>
      </td>
    </tr>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/leads/${lead.id}`} className="block p-4 transition hover:bg-cloud/60">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-[13px] font-bold text-navy">
          {lead.full_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">{lead.full_name}</p>
              <p dir="ltr" className="mt-1 text-right text-[12px] text-slate">
                {lead.phone}
              </p>
            </div>
            <StatusBadge value={lead.status.value} label={lead.status.label} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate">
            <span>{lead.program?.name_ar ?? "البرنامج غير محدد"}</span>
            <span>
              {lead.next_follow_up
                ? relativeTime(lead.next_follow_up.due_at)
                : "لا توجد متابعة"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MiniMetric({
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
    <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.06] bg-white p-4">
      <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-lg font-bold text-navy">{value}</p>
        <p className="text-[12px] text-slate">{label}</p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-navy/[0.05]">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="flex items-center gap-4 px-5 py-4">
          <div className="size-10 rounded-xl bg-cloud" />
          <div className="h-4 w-40 rounded bg-cloud" />
          <div className="mr-auto h-7 w-24 rounded-full bg-cloud" />
        </div>
      ))}
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="thin-scrollbar grid animate-pulse auto-cols-[minmax(285px,315px)] grid-flow-col gap-3 overflow-x-auto bg-cloud/65 p-4">
      {[1, 2, 3, 4].map((column) => (
        <div
          key={column}
          className="min-h-[440px] overflow-hidden rounded-2xl border border-navy/[0.06] bg-white"
        >
          <div className="flex items-center justify-between border-b border-navy/[0.05] p-4">
            <div className="h-3 w-24 rounded bg-cloud" />
            <div className="size-7 rounded-full bg-cloud" />
          </div>
          <div className="space-y-3 p-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="rounded-xl border border-navy/[0.05] p-3">
                <div className="h-3 w-32 rounded bg-cloud" />
                <div className="mt-3 h-8 rounded-lg bg-cloud/80" />
                <div className="mt-3 h-8 rounded-lg bg-cloud/80" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div>
        <CircleAlert className="mx-auto text-rose-500" size={28} />
        <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل العملاء</p>
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}

function optimisticallyMoveLead(
  current: ApiItem<LeadPipeline>,
  lead: Lead,
  targetStatus: string,
): ApiItem<LeadPipeline> {
  const targetColumn = current.data.columns.find(
    (column) => column.status.value === targetStatus,
  );

  if (!targetColumn || lead.status.value === targetStatus) return current;

  const movedLead: Lead = {
    ...lead,
    status: {
      value: targetStatus,
      label: targetColumn.status.label,
    },
  };

  return {
    ...current,
    data: {
      ...current.data,
      columns: current.data.columns.map((column) => {
        let count = column.count;
        let leads = column.leads;

        if (column.status.value === lead.status.value) {
          count = Math.max(0, count - 1);
          leads = leads.filter((item) => item.id !== lead.id);
        }

        if (column.status.value === targetStatus) {
          count += 1;
          leads = [
            movedLead,
            ...leads.filter((item) => item.id !== lead.id),
          ].slice(0, current.data.limit_per_stage);
        }

        return {
          ...column,
          count,
          leads,
          has_more: count > leads.length,
        };
      }),
    },
  };
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.errors.status?.[0] ?? error.message;
  }

  return "تعذر تحديث مرحلة العميل. حاول مرة أخرى.";
}
