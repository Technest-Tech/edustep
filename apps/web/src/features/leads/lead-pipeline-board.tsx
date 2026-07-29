"use client";

import { relativeTime } from "@/lib/format";
import type { Lead, LeadPipelineColumn } from "@/types/api";
import {
  ArrowUpLeft,
  CalendarClock,
  GripVertical,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState, type DragEvent, type ReactNode } from "react";

const stageStyles: Record<
  string,
  {
    dot: string;
    border: string;
    header: string;
    badge: string;
  }
> = {
  new: {
    dot: "bg-sky-500",
    border: "border-t-sky-400",
    header: "bg-sky-50/75",
    badge: "bg-sky-100 text-sky-700",
  },
  contacted: {
    dot: "bg-violet-500",
    border: "border-t-violet-400",
    header: "bg-violet-50/75",
    badge: "bg-violet-100 text-violet-700",
  },
  qualified: {
    dot: "bg-teal",
    border: "border-t-teal",
    header: "bg-mist/75",
    badge: "bg-teal/10 text-teal",
  },
  assessment_scheduled: {
    dot: "bg-amber-500",
    border: "border-t-amber-400",
    header: "bg-amber-50/75",
    badge: "bg-amber-100 text-amber-700",
  },
  trial_scheduled: {
    dot: "bg-orange-500",
    border: "border-t-orange-400",
    header: "bg-orange-50/75",
    badge: "bg-orange-100 text-orange-700",
  },
  won: {
    dot: "bg-emerald-500",
    border: "border-t-emerald-400",
    header: "bg-emerald-50/75",
    badge: "bg-emerald-100 text-emerald-700",
  },
  lost: {
    dot: "bg-slate-400",
    border: "border-t-slate-300",
    header: "bg-slate-50/90",
    badge: "bg-slate-100 text-slate-600",
  },
};

const movableStages = [
  ["new", "جديد"],
  ["contacted", "تم التواصل"],
  ["qualified", "مؤهل"],
  ["assessment_scheduled", "اختبار مستوى"],
  ["trial_scheduled", "حصة تجريبية"],
  ["lost", "غير مهتم"],
] as const;

export function LeadPipelineBoard({
  columns,
  movingLeadId,
  onMove,
}: {
  columns: LeadPipelineColumn[];
  movingLeadId: string | null;
  onMove: (lead: Lead, status: string) => void;
}) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const leads = columns.flatMap((column) => column.leads);

  function beginDrag(event: DragEvent<HTMLButtonElement>, lead: Lead) {
    if (lead.status.value === "won" || movingLeadId) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lead.id);
    setDraggedLeadId(lead.id);
  }

  function endDrag() {
    setDraggedLeadId(null);
    setDragOverStatus(null);
  }

  function allowDrop(event: DragEvent<HTMLElement>, status: string) {
    if (!draggedLeadId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }

  function dropLead(event: DragEvent<HTMLElement>, status: string) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain") || draggedLeadId;
    const lead = leads.find((item) => item.id === leadId);

    setDraggedLeadId(null);
    setDragOverStatus(null);

    if (lead && lead.status.value !== status) {
      onMove(lead, status);
    }
  }

  return (
    <div className="bg-cloud/65 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs leading-5 text-slate">
          اسحب الكارت بين المراحل، أو استخدم قائمة «نقل إلى» على الهاتف والكيبورد.
        </p>
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate">
          <span className="size-1.5 rounded-full bg-teal" />
          يتم حفظ المرحلة تلقائيًا
        </div>
      </div>

      <div
        className="thin-scrollbar grid auto-cols-[minmax(320px,350px)] grid-flow-col gap-3 overflow-x-auto pb-3"
        aria-label="مسار العملاء المحتملين"
      >
        {columns.map((column) => {
          const status = column.status.value;
          const style = stageStyles[status] ?? stageStyles.lost;
          const isDropTarget = dragOverStatus === status;
          const isWon = status === "won";

          return (
            <section
              key={status}
              onDragOver={(event) => allowDrop(event, status)}
              onDrop={(event) => dropLead(event, status)}
              onDragLeave={(event) => {
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                  setDragOverStatus(null);
                }
              }}
              className={`flex max-h-[calc(100vh-275px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-navy/[0.07] border-t-2 bg-white/80 shadow-[0_8px_24px_rgba(11,36,84,.04)] transition ${style.border} ${
                isDropTarget && !isWon
                  ? "border-teal bg-mist/70 shadow-[0_16px_38px_rgba(25,182,198,.13)]"
                  : ""
              } ${isDropTarget && isWon ? "border-rose-200 bg-rose-50/60" : ""}`}
              aria-label={`${column.status.label}: ${column.count} عميل`}
            >
              <header
                className={`flex min-h-[62px] items-center justify-between gap-3 border-b border-navy/[0.055] px-4 py-3.5 ${style.header}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className={`size-2.5 shrink-0 rounded-full shadow-sm ${style.dot}`} />
                  <div className="min-w-0">
                    <h2 className="whitespace-normal text-sm font-bold leading-5 text-navy">
                      {column.status.label}
                    </h2>
                    {isWon ? (
                      <p className="mt-0.5 text-[12px] text-emerald-700">تُستكمل من ملف العميل</p>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`grid min-w-8 shrink-0 place-items-center rounded-full px-2.5 py-1.5 text-[13px] font-bold ${style.badge}`}
                >
                  {column.count}
                </span>
              </header>

              <div className="thin-scrollbar flex-1 space-y-2.5 overflow-y-auto p-2.5">
                {column.leads.length ? (
                  column.leads.map((lead) => (
                    <PipelineLeadCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggedLeadId === lead.id}
                      isMoving={movingLeadId === lead.id}
                      onDragStart={beginDrag}
                      onDragEnd={endDrag}
                      onMove={onMove}
                    />
                  ))
                ) : (
                  <div
                    className={`grid min-h-32 place-items-center rounded-xl border border-dashed p-4 text-center ${
                      isDropTarget && !isWon
                        ? "border-teal/50 bg-white/70"
                        : "border-navy/[0.08] bg-cloud/45"
                    }`}
                  >
                    <div>
                      <Inbox className="mx-auto text-slate/45" size={22} />
                      <p className="mt-2 text-[13px] text-slate">لا يوجد عملاء في هذه المرحلة</p>
                    </div>
                  </div>
                )}
              </div>

              {column.has_more ? (
                <div className="border-t border-navy/[0.05] bg-white px-3 py-2 text-center text-[13px] text-slate">
                  عرض أول {column.leads.length} من {column.count}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PipelineLeadCard({
  lead,
  isDragging,
  isMoving,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  lead: Lead;
  isDragging: boolean;
  isMoving: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>, lead: Lead) => void;
  onDragEnd: () => void;
  onMove: (lead: Lead, status: string) => void;
}) {
  const isWon = lead.status.value === "won";
  const ownerInitial = lead.owner?.name.charAt(0) ?? "—";

  return (
    <article
      className={`group rounded-xl border border-navy/[0.07] bg-white p-3.5 shadow-[0_4px_14px_rgba(11,36,84,.04)] transition ${
        isDragging ? "scale-[.98] opacity-40" : "hover:-translate-y-0.5 hover:border-teal/25 hover:shadow-[0_9px_24px_rgba(11,36,84,.08)]"
      } ${isMoving ? "pointer-events-none opacity-65" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          draggable={!isWon && !isMoving}
          disabled={isWon || isMoving}
          onDragStart={(event) => onDragStart(event, lead)}
          onDragEnd={onDragEnd}
          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg transition ${
            isWon
              ? "cursor-not-allowed bg-emerald-50 text-emerald-600"
              : "cursor-grab text-slate/55 hover:bg-cloud hover:text-navy active:cursor-grabbing"
          }`}
          aria-label={isWon ? "عميل مسجل؛ المرحلة مغلقة" : `اسحب ${lead.full_name} لنقله`}
          title={isWon ? "المرحلة مكتملة" : "اسحب لنقل العميل"}
        >
          {isMoving ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : isWon ? (
            <LockKeyhole size={15} />
          ) : (
            <GripVertical size={17} />
          )}
        </button>

        <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold leading-5 text-ink">{lead.full_name}</h3>
              <p className="mt-1 truncate text-xs text-slate">
                {lead.program?.name_ar ?? "البرنامج غير محدد"}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-cloud px-2 py-1 text-[12px] font-medium text-slate">
              {lead.source.label}
            </span>
          </div>
        </Link>
      </div>

      <Link href={`/leads/${lead.id}`} className="mt-3 block">
        <div className="grid grid-cols-2 gap-2">
          <PipelineDetail icon={Phone} dir="ltr">
            {lead.phone}
          </PipelineDetail>
          <PipelineDetail icon={UserRound}>
            {lead.learner_age ? `${lead.learner_age} سنة` : "العمر غير محدد"}
          </PipelineDetail>
        </div>

        {lead.next_follow_up ? (
          <div
            className={`mt-2.5 rounded-lg border px-2.5 py-2 ${
              lead.next_follow_up.is_overdue
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-violet-100 bg-violet-50/70 text-violet-700"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CalendarClock className="shrink-0" size={14} />
              <p className="min-w-0 flex-1 text-[13px] font-semibold leading-4">
                {lead.next_follow_up.subject}
              </p>
              <span className="shrink-0 text-[12px]">
                {relativeTime(lead.next_follow_up.due_at)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 rounded-lg border border-dashed border-navy/[0.07] px-2.5 py-2 text-[13px] text-slate/65">
            لا توجد متابعة قادمة
          </div>
        )}
      </Link>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-navy/[0.05] pt-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">
            {ownerInitial}
          </span>
          <span className="truncate text-[13px] text-slate">
            {lead.owner?.name ?? "غير معيّن"}
          </span>
        </div>

        {isWon ? (
          <Link
            href={`/leads/${lead.id}`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700"
          >
            فتح
            <ArrowUpLeft size={11} />
          </Link>
        ) : (
          <label className="relative shrink-0">
            <span className="sr-only">نقل {lead.full_name} إلى مرحلة أخرى</span>
            <select
              value={lead.status.value}
              disabled={isMoving}
              onChange={(event) => {
                if (event.target.value !== lead.status.value) {
                  onMove(lead, event.target.value);
                }
              }}
              className="min-h-9 w-36 cursor-pointer appearance-none rounded-lg border border-navy/[0.07] bg-cloud py-1.5 pr-2.5 pl-7 text-[13px] font-semibold text-navy outline-none transition hover:border-teal/30 focus:border-teal"
              aria-label={`نقل ${lead.full_name} إلى مرحلة أخرى`}
            >
              {movableStages.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ArrowUpLeft
              size={10}
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-teal"
            />
          </label>
        )}
      </div>
    </article>
  );
}

function PipelineDetail({
  icon: Icon,
  children,
  dir,
}: {
  icon: typeof Phone;
  children: ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div
      dir={dir}
      className="flex min-w-0 items-center gap-1.5 rounded-lg bg-cloud/65 px-2.5 py-2 text-[13px] text-slate"
    >
      <Icon className="shrink-0 text-teal" size={13} />
      <span className="truncate">{children}</span>
    </div>
  );
}
