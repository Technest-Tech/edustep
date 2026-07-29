"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { ApiItem, FamilyServiceRequest, ServiceRequestsData } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  Filter,
  Inbox,
  LifeBuoy,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";

const statusLabels: Record<string, string> = {
  open: "جديد",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلق",
};

const categoryLabels: Record<string, string> = {
  academic: "أكاديمي",
  schedule: "المواعيد",
  billing: "الحسابات",
  technical: "دعم فني",
  complaint: "شكوى",
  other: "أخرى",
};

const priorityLabels: Record<string, string> = {
  normal: "عادي",
  high: "مهم",
  urgent: "عاجل",
};

export function ServiceRequestsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<FamilyServiceRequest | null>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({
    queryKey: ["service-requests"],
    queryFn: () => apiClient<ApiItem<ServiceRequestsData>>("/api/v1/service-requests"),
  });
  const data = query.data?.data;
  const requests = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    return (data?.requests ?? []).filter((request) => {
      const matchesStatus = status === "all" || request.status === status;
      const matchesSearch =
        !normalized ||
        request.subject.toLowerCase().includes(normalized) ||
        request.request_number.toLowerCase().includes(normalized) ||
        request.guardian?.name?.toLowerCase().includes(normalized) ||
        request.student?.full_name.toLowerCase().includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [data?.requests, deferredSearch, status]);
  const claim = useMutation({
    mutationFn: (request: FamilyServiceRequest) =>
      apiClient(`/api/v1/service-requests/${request.id}`, {
        method: "PATCH",
        json: {
          status: "in_progress",
          assigned_to: user?.id,
          priority: request.priority,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["service-requests"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Family Care · تجربة الأسرة"
        title="طلبات أولياء الأمور"
        description="صندوق خدمة موحد للأسئلة الأكاديمية والمواعيد والحسابات، مع مسؤول واضح وحالة وحل موثق."
        actions={
          <Button variant="secondary" onClick={() => query.refetch()}>
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RequestMetric icon={Inbox} label="إجمالي الطلبات" value={data?.summary.total ?? 0} tone="bg-sky-50 text-sky-700" />
        <RequestMetric icon={MessageSquareText} label="طلبات جديدة" value={data?.summary.open ?? 0} tone="bg-violet-50 text-violet-700" />
        <RequestMetric icon={Clock3} label="قيد المعالجة" value={data?.summary.in_progress ?? 0} tone="bg-amber-50 text-amber-700" />
        <RequestMetric icon={ShieldAlert} label="تحتاج أولوية" value={data?.summary.urgent ?? 0} tone="bg-rose-50 text-rose-700" />
      </section>

      <section className="overflow-hidden rounded-3xl border border-navy/[0.065] bg-white shadow-[0_14px_44px_rgba(11,36,84,.04)]">
        <div className="flex flex-col gap-3 border-b border-navy/[0.055] p-4 lg:flex-row lg:items-center lg:p-5">
          <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud/70 px-3.5 text-slate">
            <Search size={17} />
            <span className="sr-only">البحث في الطلبات</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="رقم الطلب، الموضوع، ولي الأمر أو الطالب..."
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={15} className="shrink-0 text-slate" />
            {[
              ["all", "كل الحالات"],
              ["open", "جديدة"],
              ["in_progress", "قيد المعالجة"],
              ["resolved", "تم الحل"],
              ["closed", "مغلقة"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold ${
                  status === value ? "bg-navy text-white" : "bg-cloud text-slate"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-cloud" />)}</div>
        ) : query.isError ? (
          <div className="grid min-h-72 place-items-center text-center">
            <div><CircleAlert className="mx-auto text-rose-500" size={28} /><p className="mt-3 text-xs font-bold text-navy">تعذر تحميل الطلبات</p></div>
          </div>
        ) : requests.length ? (
          <div className="divide-y divide-navy/[0.055]">
            {requests.map((request) => (
              <article key={request.id} className="p-4 transition hover:bg-cloud/45 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                      request.priority === "urgent" || request.priority === "high"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-mist text-teal"
                    }`}>
                      <LifeBuoy size={19} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[11px] font-bold text-teal">{request.request_number}</p>
                        <span className="rounded-full bg-cloud px-2 py-1 text-[11px] text-slate">{categoryLabels[request.category]}</span>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                          request.priority === "normal" ? "bg-slate-50 text-slate" : "bg-rose-50 text-rose-700"
                        }`}>{priorityLabels[request.priority]}</span>
                      </div>
                      <h2 className="mt-2 text-[13px] font-bold text-navy">{request.subject}</h2>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate">{request.description}</p>
                    </div>
                  </div>

                  <div className="grid shrink-0 gap-3 sm:grid-cols-3 xl:w-[470px]">
                    <div>
                      <p className="text-[11px] text-slate">ولي الأمر والطالب</p>
                      <p className="mt-1 truncate text-[12px] font-semibold text-navy">{request.guardian?.name ?? "—"}</p>
                      <p className="mt-1 truncate text-[11px] text-slate">{request.student?.full_name ?? "طلب عام"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate">المسؤول</p>
                      <p className="mt-1 truncate text-[12px] font-semibold text-navy">{request.assignee?.name ?? "غير مسند"}</p>
                      <p className="mt-1 text-[11px] text-slate">{formatDateTime(request.created_at)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <StatusBadge value={request.status} label={statusLabels[request.status]} />
                      {request.status === "open" ? (
                        <Button size="sm" disabled={claim.isPending} onClick={() => claim.mutate(request)}>
                          استلام
                        </Button>
                      ) : request.status === "in_progress" ? (
                        <Button size="sm" variant="secondary" onClick={() => setSelected(request)}>
                          تسجيل الحل
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setSelected(request)}>
                          التفاصيل
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {request.resolution ? (
                  <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-emerald-700"><BadgeCheck size={13} />الحل المسجل</p>
                    <p className="mt-1 text-[12px] leading-5 text-emerald-900/70">{request.resolution}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div><Inbox className="mx-auto text-teal" size={30} /><p className="mt-3 text-xs font-bold text-navy">لا توجد طلبات مطابقة</p></div>
          </div>
        )}
      </section>

      <ResolveRequestDialog
        request={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          setSelected(null);
          queryClient.invalidateQueries({ queryKey: ["service-requests"] });
        }}
      />
    </div>
  );
}

function ResolveRequestDialog({
  request,
  open,
  onClose,
  onUpdated,
}: {
  request: FamilyServiceRequest | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [resolution, setResolution] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/service-requests/${request!.id}`, {
        method: "PATCH",
        json: {
          status: request!.status === "resolved" || request!.status === "closed" ? request!.status : "resolved",
          priority: request!.priority,
          assigned_to: request!.assignee?.id ?? null,
          resolution: resolution || request!.resolution,
        },
      }),
    onSuccess: onUpdated,
  });

  if (!request) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-[2px]" />
        <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">تفاصيل طلب الخدمة</Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] text-slate">{request.request_number} · {request.subject}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button size="icon" variant="secondary" aria-label="إغلاق"><X size={16} /></Button></Dialog.Close>
          </div>
          <div className="mt-5 rounded-2xl bg-cloud p-4">
            <p className="text-[12px] leading-6 text-slate">{request.description}</p>
          </div>
          {request.status === "in_progress" || request.status === "open" ? (
            <form className="mt-5" onSubmit={(event: FormEvent) => { event.preventDefault(); mutation.mutate(); }}>
              <label className="text-[12px] font-semibold text-navy">
                الحل والإجراء الذي تم
                <textarea
                  required
                  rows={5}
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  placeholder="سجّل ما تم الاتفاق عليه أو تنفيذه..."
                  className="mt-2 w-full rounded-xl border border-navy/10 p-3 text-[12px] outline-none focus:border-teal/50"
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                <Button type="submit" disabled={mutation.isPending}><BadgeCheck size={14} />حفظ وإغلاق الطلب</Button>
              </div>
            </form>
          ) : (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
              <p className="text-[11px] font-bold text-emerald-700">الحل المسجل</p>
              <p className="mt-2 text-[12px] leading-6 text-emerald-900/70">{request.resolution}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RequestMetric({ icon: Icon, label, value, tone }: { icon: typeof LifeBuoy; label: string; value: number; tone: string }) {
  return (
    <article className="rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-2xl ${tone}`}><Icon size={18} /></span><div><p className="text-xl font-bold text-navy">{value}</p><p className="mt-0.5 text-[11px] text-slate">{label}</p></div></div>
    </article>
  );
}
