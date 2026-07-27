"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate, formatDateTime, relativeTime } from "@/lib/format";
import type {
  AdmissionsData,
  ApiItem,
  EnrollmentOffer,
  SeatReservation,
  TrialBooking,
  WaitlistEntry,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpLeft,
  BadgeCheck,
  CalendarCheck2,
  CircleAlert,
  Clock3,
  Coins,
  Hourglass,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TicketCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type View = "offers" | "trials" | "waitlist" | "holds";

const offerLabels: Record<string, string> = {
  draft: "مسودة",
  sent: "تم الإرسال",
  accepted: "تم القبول",
  declined: "مرفوض",
  expired: "منتهي",
  cancelled: "ملغي",
};
const trialLabels: Record<string, string> = {
  scheduled: "مجدولة",
  confirmed: "مؤكدة",
  attended: "حضر",
  no_show: "لم يحضر",
  cancelled: "ملغاة",
};
const waitlistLabels: Record<string, string> = {
  waiting: "بانتظار مقعد",
  offered: "تم عرض مقعد",
  converted: "تم التسجيل",
  withdrawn: "منسحب",
  expired: "منتهي",
};
const holdLabels: Record<string, string> = {
  held: "محجوز",
  converted: "تم التسجيل",
  released: "تم التحرير",
  expired: "منتهي",
};

export function AdmissionsContent() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<View>("offers");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["admissions"],
    queryFn: () => apiClient<ApiItem<AdmissionsData>>("/api/v1/admissions"),
  });
  const action = useMutation({
    mutationFn: ({ path, json }: { path: string; json?: Record<string, unknown> }) =>
      apiClient(path, { method: json ? "PATCH" : "POST", json }),
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);
    },
    onError: (error) => setActionError(errorMessage(error)),
  });
  const postAction = useMutation({
    mutationFn: ({ path, json }: { path: string; json?: Record<string, unknown> }) =>
      apiClient(path, { method: "POST", json }),
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]);
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  if (query.isLoading) {
    return <AdmissionsSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="grid min-h-96 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <div>
          <CircleAlert className="mx-auto text-rose-500" size={30} />
          <h1 className="mt-4 text-base font-bold text-navy">تعذر تحميل مركز القبول</h1>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const data = query.data.data;
  const term = search.trim().toLowerCase();
  const matches = (lead?: { full_name: string; phone: string }, cohort?: { name: string }) =>
    !term ||
    lead?.full_name.toLowerCase().includes(term) ||
    lead?.phone.includes(term) ||
    cohort?.name.toLowerCase().includes(term);
  const offers = data.offers.filter((item) => matches(item.lead, item.cohort));
  const trials = data.trials.filter((item) => matches(item.lead, item.cohort));
  const waitlist = data.waitlist.filter((item) => matches(item.lead, item.cohort));
  const holds = data.reservations.filter((item) => matches(item.lead, item.cohort));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADMISSIONS COMMAND CENTER"
        title="القبول والتجارب"
        description="تابع رحلة التسجيل من التجربة والعرض وحتى حجز المقعد، مع رؤية فورية لسعة الجروبات وقوائم الانتظار."
        actions={
          <>
            <Button variant="secondary" onClick={() => query.refetch()}>
              <RefreshCw size={15} />
              تحديث
            </Button>
            <Link href="/leads">
              <Button>
                <UserRoundPlus size={16} className="text-sun" />
                اختيار عميل
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Coins}
          label="قيمة العروض المفتوحة"
          value={formatCurrency(data.summary.offers_value)}
          hint={`${data.summary.open_offers} عروض قيد القرار`}
          tone="bg-sky-50 text-sky-700"
        />
        <MetricCard
          icon={CalendarCheck2}
          label="التجارب القادمة"
          value={String(data.summary.upcoming_trials)}
          hint="مجدولة أو مؤكدة"
          tone="bg-violet-50 text-violet-700"
        />
        <MetricCard
          icon={TicketCheck}
          label="حجوزات المقاعد"
          value={String(data.summary.active_holds)}
          hint="حجوزات مؤقتة نشطة"
          tone="bg-amber-50 text-amber-700"
        />
        <MetricCard
          icon={Hourglass}
          label="قائمة الانتظار"
          value={String(data.summary.waiting)}
          hint="عملاء ينتظرون مقعدًا"
          tone="bg-rose-50 text-rose-700"
        />
        <MetricCard
          icon={BadgeCheck}
          label="قبول هذا الشهر"
          value={String(data.summary.accepted_this_month)}
          hint="تحولوا إلى طلاب"
          tone="bg-emerald-50 text-emerald-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl bg-navy text-white shadow-[0_18px_45px_rgba(11,36,84,.14)]">
        <div className="grid gap-px bg-white/10 sm:grid-cols-4">
          {[
            ["01", "تأهيل العميل", "اختبار المستوى والاحتياج"],
            ["02", "تجربة مناسبة", "موعد داخل الجروب المستهدف"],
            ["03", "عرض وحجز", "سعر واضح ومقعد مؤقت"],
            ["04", "تسجيل وفاتورة", "طالب نشط بدون إدخال مكرر"],
          ].map(([step, title, description], index) => (
            <div key={step} className="relative bg-navy px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-teal">{step}</span>
                {index < 3 ? <ArrowUpLeft className="text-white/20" size={14} /> : null}
              </div>
              <p className="mt-2 text-[11px] font-semibold">{title}</p>
              <p className="mt-1 text-[8px] text-white/45">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {actionError ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] text-rose-700">
          <CircleAlert size={15} />
          {actionError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
        <div className="flex flex-col gap-4 border-b border-navy/[0.055] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl bg-cloud p-1">
            <ViewButton active={activeView === "offers"} onClick={() => setActiveView("offers")} count={data.offers.length}>
              العروض
            </ViewButton>
            <ViewButton active={activeView === "trials"} onClick={() => setActiveView("trials")} count={data.trials.length}>
              التجارب
            </ViewButton>
            <ViewButton active={activeView === "waitlist"} onClick={() => setActiveView("waitlist")} count={data.waitlist.length}>
              الانتظار
            </ViewButton>
            <ViewButton active={activeView === "holds"} onClick={() => setActiveView("holds")} count={data.reservations.length}>
              حجز المقاعد
            </ViewButton>
          </div>
          <label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-navy/[0.08] bg-cloud px-3 lg:max-w-xs">
            <Search size={15} className="text-slate" />
            <span className="sr-only">بحث</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[10px] text-ink outline-none"
              placeholder="اسم العميل، الهاتف، أو الجروب..."
            />
          </label>
        </div>

        {activeView === "offers" ? (
          <OffersPanel
            items={offers}
            pending={postAction.isPending}
            onSend={(id) => postAction.mutate({ path: `/api/v1/offers/${id}/send` })}
            onAccept={(id) => postAction.mutate({ path: `/api/v1/offers/${id}/accept` })}
          />
        ) : null}
        {activeView === "trials" ? (
          <TrialsPanel
            items={trials}
            pending={action.isPending}
            onStatus={(id, status) =>
              action.mutate({
                path: `/api/v1/trials/${id}`,
                json: { status },
              })
            }
          />
        ) : null}
        {activeView === "waitlist" ? (
          <WaitlistPanel
            items={waitlist}
            pending={postAction.isPending}
            onPromote={(id) =>
              postAction.mutate({ path: `/api/v1/waitlist/${id}/promote` })
            }
          />
        ) : null}
        {activeView === "holds" ? (
          <HoldsPanel
            items={holds}
            pending={postAction.isPending}
            onRelease={(id) =>
              postAction.mutate({
                path: `/api/v1/seat-reservations/${id}/release`,
              })
            }
          />
        ) : null}
      </section>
    </div>
  );
}

function OffersPanel({
  items,
  pending,
  onSend,
  onAccept,
}: {
  items: EnrollmentOffer[];
  pending: boolean;
  onSend: (id: string) => void;
  onAccept: (id: string) => void;
}) {
  return (
    <ListLayout empty="لا توجد عروض مطابقة.">
      {items.map((offer) => (
        <article key={offer.id} className="grid gap-4 px-5 py-4 transition hover:bg-cloud/45 xl:grid-cols-[1.1fr_1fr_150px_140px] xl:items-center">
          <PersonCell lead={offer.lead} reference={offer.offer_number} />
          <div>
            <p className="text-[10px] font-semibold text-ink">{offer.cohort?.name ?? "—"}</p>
            <p className="mt-1 text-[8px] text-slate">
              صالح حتى {formatDate(offer.valid_until)} · {formatCurrency(offer.net_amount)}
            </p>
            {offer.seat_reservation?.status === "held" ? (
              <p className="mt-1.5 text-[8px] font-semibold text-amber-700">
                المقعد محجوز {relativeTime(offer.seat_reservation.reserved_until ?? offer.valid_until)}
              </p>
            ) : null}
          </div>
          <StatusBadge value={offer.status} label={offerLabels[offer.status]} />
          <div className="flex justify-end gap-2">
            {offer.status === "draft" ? (
              <Button size="sm" disabled={pending} onClick={() => onSend(offer.id)}>
                <Send size={13} />
                إرسال
              </Button>
            ) : null}
            {offer.status === "sent" ? (
              <Button size="sm" variant="teal" disabled={pending} onClick={() => onAccept(offer.id)}>
                <BadgeCheck size={13} />
                تسجيل القبول
              </Button>
            ) : null}
            <LeadLink id={offer.lead?.id} />
          </div>
        </article>
      ))}
    </ListLayout>
  );
}

function TrialsPanel({
  items,
  pending,
  onStatus,
}: {
  items: TrialBooking[];
  pending: boolean;
  onStatus: (id: string, status: string) => void;
}) {
  return (
    <ListLayout empty="لا توجد تجارب مطابقة.">
      {items.map((trial) => (
        <article key={trial.id} className="grid gap-4 px-5 py-4 transition hover:bg-cloud/45 xl:grid-cols-[1.1fr_1fr_150px_170px] xl:items-center">
          <PersonCell lead={trial.lead} reference={`${trial.duration_minutes} دقيقة`} />
          <div>
            <p className="text-[10px] font-semibold text-ink">{trial.cohort?.name ?? "—"}</p>
            <p className="mt-1 text-[8px] text-slate">{formatDateTime(trial.scheduled_at)}</p>
            <p className="mt-1 text-[8px] text-slate">{trial.room_name ?? (trial.meeting_url ? "أونلاين" : "المكان غير محدد")}</p>
          </div>
          <StatusBadge value={trial.status} label={trialLabels[trial.status]} />
          <div className="flex items-center justify-end gap-2">
            {["scheduled", "confirmed"].includes(trial.status) ? (
              <select
                aria-label="تحديث حالة التجربة"
                value=""
                disabled={pending}
                onChange={(event) => event.target.value && onStatus(trial.id, event.target.value)}
                className="min-h-8 rounded-lg border border-navy/[0.09] bg-white px-2 text-[9px] text-navy outline-none"
              >
                <option value="">تحديث الحالة</option>
                {trial.status === "scheduled" ? <option value="confirmed">تأكيد الحضور</option> : null}
                <option value="attended">حضر التجربة</option>
                <option value="no_show">لم يحضر</option>
                <option value="cancelled">إلغاء</option>
              </select>
            ) : null}
            <LeadLink id={trial.lead?.id} />
          </div>
        </article>
      ))}
    </ListLayout>
  );
}

function WaitlistPanel({
  items,
  pending,
  onPromote,
}: {
  items: WaitlistEntry[];
  pending: boolean;
  onPromote: (id: string) => void;
}) {
  return (
    <ListLayout empty="قائمة الانتظار فارغة.">
      {items.map((entry) => (
        <article key={entry.id} className="grid gap-4 px-5 py-4 transition hover:bg-cloud/45 xl:grid-cols-[1.1fr_1fr_150px_170px] xl:items-center">
          <PersonCell lead={entry.lead} reference={`الأولوية ${entry.priority}`} />
          <div>
            <p className="text-[10px] font-semibold text-ink">{entry.cohort?.name ?? "—"}</p>
            <p className="mt-1 text-[8px] text-slate">منذ {formatDateTime(entry.joined_at)}</p>
            {entry.notes ? <p className="mt-1 line-clamp-1 text-[8px] text-slate">{entry.notes}</p> : null}
          </div>
          <StatusBadge value={entry.status} label={waitlistLabels[entry.status]} />
          <div className="flex justify-end gap-2">
            {entry.status === "waiting" ? (
              <Button size="sm" variant="teal" disabled={pending} onClick={() => onPromote(entry.id)}>
                <TicketCheck size={13} />
                عرض مقعد
              </Button>
            ) : null}
            <LeadLink id={entry.lead?.id} />
          </div>
        </article>
      ))}
    </ListLayout>
  );
}

function HoldsPanel({
  items,
  pending,
  onRelease,
}: {
  items: SeatReservation[];
  pending: boolean;
  onRelease: (id: string) => void;
}) {
  return (
    <ListLayout empty="لا توجد حجوزات مقاعد.">
      {items.map((reservation) => (
        <article key={reservation.id} className="grid gap-4 px-5 py-4 transition hover:bg-cloud/45 xl:grid-cols-[1.1fr_1fr_150px_170px] xl:items-center">
          <PersonCell lead={reservation.lead} reference={reservation.offer_id ? "مرتبط بعرض" : "حجز مباشر"} />
          <div>
            <p className="text-[10px] font-semibold text-ink">{reservation.cohort?.name ?? "—"}</p>
            <p className="mt-1 flex items-center gap-1 text-[8px] text-slate">
              <Clock3 size={11} />
              {reservation.status === "held"
                ? `ينتهي ${relativeTime(reservation.reserved_until)}`
                : formatDateTime(reservation.released_at ?? reservation.converted_at)}
            </p>
          </div>
          <StatusBadge value={reservation.status} label={holdLabels[reservation.status]} />
          <div className="flex justify-end gap-2">
            {reservation.status === "held" ? (
              <Button size="sm" variant="danger" disabled={pending} onClick={() => onRelease(reservation.id)}>
                تحرير المقعد
              </Button>
            ) : null}
            <LeadLink id={reservation.lead?.id} />
          </div>
        </article>
      ))}
    </ListLayout>
  );
}

function ListLayout({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  if (!children.length) {
    return (
      <div className="grid min-h-56 place-items-center p-8 text-center">
        <div>
          <Sparkles className="mx-auto text-teal" size={26} />
          <p className="mt-3 text-[10px] font-semibold text-navy">{empty}</p>
        </div>
      </div>
    );
  }

  return <div className="divide-y divide-navy/[0.05]">{children}</div>;
}

function PersonCell({
  lead,
  reference,
}: {
  lead?: { id: string; full_name: string; phone: string };
  reference: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-[11px] font-bold text-navy">
        {lead?.full_name.charAt(0) ?? "؟"}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold text-ink">{lead?.full_name ?? "عميل غير متاح"}</p>
        <p className="mt-1 text-[8px] text-slate">{lead?.phone ?? "—"} · {reference}</p>
      </div>
    </div>
  );
}

function LeadLink({ id }: { id?: string }) {
  return id ? (
    <Link href={`/leads/${id}`} className="inline-flex min-h-8 items-center rounded-lg px-2 text-[9px] font-semibold text-slate transition hover:bg-cloud hover:text-navy">
      فتح الملف
    </Link>
  ) : null;
}

function ViewButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[9px] font-semibold transition ${
        active ? "bg-white text-navy shadow-sm" : "text-slate hover:text-navy"
      }`}
    >
      {children}
      <span className={`rounded-full px-1.5 py-0.5 text-[7px] ${active ? "bg-mist text-teal" : "bg-white text-slate"}`}>
        {count}
      </span>
    </button>
  );
}

function MetricCard({
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
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </div>
      <p className="mt-4 text-[9px] font-medium text-slate">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-[8px] text-slate/75">{hint}</p>
    </article>
  );
}

function AdmissionsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-2xl bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white" />
    </div>
  );
}

function errorMessage(value: unknown) {
  if (value instanceof ApiError) {
    return Object.values(value.errors).flat()[0] ?? value.message;
  }

  return "تعذر تنفيذ الإجراء. حاول مرة أخرى.";
}
