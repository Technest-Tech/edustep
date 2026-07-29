import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-600/10",
  contacted: "bg-violet-50 text-violet-700 ring-violet-600/10",
  qualified: "bg-teal/10 text-navy ring-teal/20",
  assessment_scheduled: "bg-amber-50 text-amber-800 ring-amber-600/10",
  trial_scheduled: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  lost: "bg-slate-100 text-slate-600 ring-slate-600/10",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  enrolling: "bg-sky-50 text-sky-700 ring-sky-600/10",
  planned: "bg-violet-50 text-violet-700 ring-violet-600/10",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/10",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  issued: "bg-sky-50 text-sky-700 ring-sky-600/10",
  partially_paid: "bg-amber-50 text-amber-800 ring-amber-600/10",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/10",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-600/10",
  draft: "bg-slate-100 text-slate-600 ring-slate-600/10",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  open: "bg-sky-50 text-sky-700 ring-sky-600/10",
  monitoring: "bg-amber-50 text-amber-800 ring-amber-600/10",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  closed: "bg-slate-100 text-slate-600 ring-slate-600/10",
  paused: "bg-amber-50 text-amber-800 ring-amber-600/10",
  graduated: "bg-violet-50 text-violet-700 ring-violet-600/10",
  inactive: "bg-slate-100 text-slate-600 ring-slate-600/10",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/10",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-600/10",
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  absent: "bg-rose-50 text-rose-700 ring-rose-600/10",
  late: "bg-amber-50 text-amber-800 ring-amber-600/10",
  excused: "bg-slate-100 text-slate-600 ring-slate-600/10",
  needs_improvement: "bg-rose-50 text-rose-700 ring-rose-600/10",
  developing: "bg-amber-50 text-amber-800 ring-amber-600/10",
  good: "bg-sky-50 text-sky-700 ring-sky-600/10",
  excellent: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  submitted: "bg-sky-50 text-sky-700 ring-sky-600/10",
  approved: "bg-violet-50 text-violet-700 ring-violet-600/10",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/10",
  void: "bg-slate-100 text-slate-600 ring-slate-600/10",
  sent: "bg-sky-50 text-sky-700 ring-sky-600/10",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  declined: "bg-rose-50 text-rose-700 ring-rose-600/10",
  expired: "bg-slate-100 text-slate-600 ring-slate-600/10",
  confirmed: "bg-violet-50 text-violet-700 ring-violet-600/10",
  attended: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  no_show: "bg-rose-50 text-rose-700 ring-rose-600/10",
  held: "bg-amber-50 text-amber-800 ring-amber-600/10",
  converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  released: "bg-slate-100 text-slate-600 ring-slate-600/10",
  waiting: "bg-amber-50 text-amber-800 ring-amber-600/10",
  offered: "bg-violet-50 text-violet-700 ring-violet-600/10",
  withdrawn: "bg-slate-100 text-slate-600 ring-slate-600/10",
  settings: "bg-violet-50 text-violet-700 ring-violet-600/10",
  security: "bg-rose-50 text-rose-700 ring-rose-600/10",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  admissions: "bg-sky-50 text-sky-700 ring-sky-600/10",
  crm: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10",
  academics: "bg-teal/10 text-navy ring-teal/20",
  operations: "bg-amber-50 text-amber-800 ring-amber-600/10",
};

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset",
        statusStyles[value] ?? "bg-slate-50 text-slate-600 ring-slate-600/10",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}
