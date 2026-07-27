"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatDateTime, relativeTime } from "@/lib/format";
import type {
  ApiCollection,
  ApiItem,
  Cohort,
  Lead,
  Program,
  Student,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  Check,
  CircleAlert,
  ClipboardCheck,
  GraduationCap,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  Send,
  TicketCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import {
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

const statuses = [
  ["new", "جديد"],
  ["contacted", "تم التواصل"],
  ["qualified", "مؤهل"],
  ["assessment_scheduled", "اختبار مستوى"],
  ["trial_scheduled", "حصة تجريبية"],
  ["lost", "غير مهتم"],
] as const;

type DialogName =
  | "follow-up"
  | "note"
  | "assessment"
  | "offer"
  | "trial"
  | "seat"
  | "convert"
  | null;
type LevelOption = NonNullable<Program["levels"]>[number] & {
  programName: string;
};

export function LeadDetail({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient();
  const [activeDialog, setActiveDialog] = useState<DialogName>(null);
  const leadQuery = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => apiClient<ApiItem<Lead>>(`/api/v1/leads/${leadId}`),
  });
  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiClient<ApiCollection<Program>>("/api/v1/programs"),
  });
  const cohortsQuery = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => apiClient<ApiCollection<Cohort>>("/api/v1/cohorts"),
  });

  async function refreshLead() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
      queryClient.invalidateQueries({ queryKey: ["leads"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["admissions"] }),
      queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
    ]);
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiClient<ApiItem<Lead>>(`/api/v1/leads/${leadId}`, {
        method: "PATCH",
        json: { status },
      }),
    onSuccess: refreshLead,
  });
  const completeFollowUp = useMutation({
    mutationFn: (followUpId: string) =>
      apiClient(`/api/v1/follow-ups/${followUpId}`, {
        method: "PATCH",
        json: { status: "completed" },
      }),
    onSuccess: refreshLead,
  });

  if (leadQuery.isLoading) {
    return <LeadDetailSkeleton />;
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center">
        <CircleAlert className="mx-auto text-rose-500" size={28} />
        <h1 className="mt-3 text-lg font-bold text-navy">تعذر فتح ملف العميل</h1>
        <Button className="mt-5" onClick={() => leadQuery.refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const lead = leadQuery.data.data;
  const pendingFollowUps =
    lead.follow_ups?.filter((followUp) => followUp.status === "pending") ?? [];
  const levels =
    programsQuery.data?.data.flatMap((program) =>
      (program.levels ?? []).map((level) => ({
        ...level,
        programName: program.name_ar,
      })),
    ) ?? [];
  const latestOffer = lead.enrollment_offers?.[0];
  const latestTrial = lead.trial_bookings?.[0];
  const activeReservation = lead.seat_reservations?.find(
    (reservation) => reservation.status === "held",
  );
  const waitingEntry = lead.waitlist_entries?.find(
    (entry) => entry.status === "waiting" || entry.status === "offered",
  );

  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate transition hover:text-navy"
      >
        <ArrowRight size={14} />
        العودة إلى العملاء
      </Link>

      <PageHeader
        eyebrow={`CRM · ${lead.source.label}`}
        title={lead.full_name}
        description={`${lead.phone} · ${lead.program?.name_ar ?? "لم يتم تحديد البرنامج"}`}
        actions={
          <>
            <a href={`tel:${lead.phone}`}>
              <Button variant="secondary">
                <Phone size={15} />
                اتصال
              </Button>
            </a>
            <a
              href={`https://wa.me/${lead.whatsapp_phone ?? lead.phone}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="teal">
                <MessageCircle size={15} />
                WhatsApp
              </Button>
            </a>
            {lead.status.value !== "won" ? (
              <Button variant="secondary" onClick={() => setActiveDialog("trial")}>
                <CalendarPlus size={15} />
                حجز تجربة
              </Button>
            ) : null}
            {lead.status.value !== "won" ? (
              <Button onClick={() => setActiveDialog("offer")}>
                <Send size={16} className="text-sun" />
                إنشاء عرض
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-medium text-slate">مرحلة العميل الحالية</p>
                <div className="mt-2">
                  <StatusBadge value={lead.status.value} label={lead.status.label} />
                </div>
              </div>
              {lead.status.value !== "won" ? (
                <label className="flex items-center gap-2">
                  <span className="text-[9px] text-slate">تغيير المرحلة</span>
                  <select
                    value={lead.status.value}
                    disabled={statusMutation.isPending}
                    onChange={(event) => statusMutation.mutate(event.target.value)}
                    className="min-h-10 rounded-xl border border-navy/[0.08] bg-cloud px-3 text-[10px] text-navy outline-none"
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-[10px] font-semibold text-emerald-700">
                  الطالب: {lead.student?.student_code}
                </p>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <div className="flex items-center justify-between border-b border-navy/[0.055] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy">سجل التواصل والنشاط</h2>
                <p className="mt-1 text-[9px] text-slate">تاريخ كامل لكل خطوة مع العميل</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setActiveDialog("note")}>
                <NotebookPen size={14} />
                إضافة ملاحظة
              </Button>
            </div>

            <div className="p-5">
              {lead.activities?.length ? (
                <div className="relative space-y-6 before:absolute before:bottom-2 before:right-[17px] before:top-2 before:w-px before:bg-navy/[0.08]">
                  {lead.activities.map((activity) => (
                    <article key={activity.id} className="relative flex gap-4">
                      <div className="z-10 grid size-9 shrink-0 place-items-center rounded-xl border border-navy/[0.06] bg-cloud text-teal">
                        {activity.type === "converted" ? (
                          <GraduationCap size={16} />
                        ) : activity.type === "meeting" ? (
                          <ClipboardCheck size={16} />
                        ) : (
                          <MessageCircle size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-navy/[0.05] bg-cloud/45 p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-[10px] font-semibold text-ink">
                            {activity.title}
                          </h3>
                          <span className="text-[8px] text-slate">
                            {formatDateTime(activity.occurred_at)}
                          </span>
                        </div>
                        {activity.details ? (
                          <p className="mt-2 text-[9px] leading-5 text-slate">
                            {activity.details}
                          </p>
                        ) : null}
                        <p className="mt-2 text-[8px] text-slate/65">
                          {activity.creator?.name ?? "النظام"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-[10px] text-slate">
                  لا يوجد نشاط مسجل بعد.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <div className="bg-navy px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-semibold text-teal">ADMISSION JOURNEY</p>
                  <h2 className="mt-1 text-sm font-bold">رحلة القبول</h2>
                </div>
                <TicketCheck className="text-sun" size={19} />
              </div>
            </div>
            <div className="space-y-3 p-5">
              <JourneyRow
                label="آخر تجربة"
                value={
                  latestTrial
                    ? `${formatDateTime(latestTrial.scheduled_at)} · ${trialStatusLabel(latestTrial.status)}`
                    : "لم تحجز تجربة"
                }
                active={Boolean(latestTrial)}
              />
              <JourneyRow
                label="آخر عرض"
                value={
                  latestOffer
                    ? `${latestOffer.offer_number} · ${offerStatusLabel(latestOffer.status)}`
                    : "لم ينشأ عرض"
                }
                active={Boolean(latestOffer)}
              />
              <JourneyRow
                label="المقعد"
                value={
                  activeReservation
                    ? `محجوز حتى ${formatDateTime(activeReservation.reserved_until)}`
                    : waitingEntry
                      ? "على قائمة الانتظار"
                      : "لا يوجد حجز نشط"
                }
                active={Boolean(activeReservation)}
                warning={Boolean(waitingEntry)}
              />
              {lead.status.value !== "won" ? (
                <div className="grid grid-cols-3 gap-2 border-t border-navy/[0.055] pt-3">
                  <Button size="sm" variant="secondary" onClick={() => setActiveDialog("trial")}>
                    تجربة
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setActiveDialog("seat")}>
                    مقعد
                  </Button>
                  <Button size="sm" onClick={() => setActiveDialog("offer")}>
                    عرض
                  </Button>
                </div>
              ) : null}
              {lead.status.value !== "won" && !latestOffer ? (
                <button
                  type="button"
                  onClick={() => setActiveDialog("convert")}
                  className="w-full text-center text-[8px] font-semibold text-slate transition hover:text-navy"
                >
                  تسجيل مباشر بدون عرض
                </button>
              ) : null}
              {latestOffer?.status === "sent" ? (
                <Link href="/admissions" className="block">
                  <Button className="w-full" variant="teal">
                    <GraduationCap size={14} />
                    مراجعة العرض وإتمام القبول
                  </Button>
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-navy">المتابعات</h2>
                <p className="mt-1 text-[9px] text-slate">
                  {pendingFollowUps.length} مهام مفتوحة
                </p>
              </div>
              <Button size="icon" variant="secondary" onClick={() => setActiveDialog("follow-up")}>
                <Plus size={16} />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {pendingFollowUps.length ? (
                pendingFollowUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className={`rounded-xl border p-3.5 ${
                      followUp.is_overdue
                        ? "border-rose-100 bg-rose-50/55"
                        : "border-navy/[0.055] bg-cloud/55"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <CalendarClock
                        size={16}
                        className={followUp.is_overdue ? "text-rose-500" : "text-teal"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-ink">
                          {followUp.subject}
                        </p>
                        <p
                          className={`mt-1 text-[8px] ${
                            followUp.is_overdue ? "text-rose-600" : "text-slate"
                          }`}
                        >
                          {relativeTime(followUp.due_at)} · {followUp.assignee?.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => completeFollowUp.mutate(followUp.id)}
                        className="grid size-7 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                        aria-label="إكمال المتابعة"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center">
                  <Check className="mx-auto text-emerald-600" size={20} />
                  <p className="mt-2 text-[9px] font-semibold text-emerald-700">
                    لا توجد متابعات مفتوحة
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">اختبار المستوى</h2>
              <Button size="sm" variant="ghost" onClick={() => setActiveDialog("assessment")}>
                {lead.placement_assessment ? "تعديل" : "تحديد موعد"}
              </Button>
            </div>
            {lead.placement_assessment ? (
              <div className="mt-4 rounded-xl bg-mist/65 p-4">
                <StatusBadge
                  value={lead.placement_assessment.status}
                  label={
                    lead.placement_assessment.status === "completed"
                      ? "مكتمل"
                      : "مجدول"
                  }
                />
                <p className="mt-3 text-[10px] font-semibold text-navy">
                  {formatDateTime(lead.placement_assessment.scheduled_at)}
                </p>
                <p className="mt-1 text-[8px] text-slate">
                  المستوى المقترح:{" "}
                  {lead.placement_assessment.recommended_level?.name_ar ?? "لم يحدد"}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-cloud px-4 py-5 text-center text-[9px] text-slate">
                لم يتم تحديد اختبار مستوى بعد.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_30px_rgba(11,36,84,.035)]">
            <h2 className="text-sm font-bold text-navy">بيانات العميل</h2>
            <dl className="mt-4 space-y-3">
              <InfoRow icon={<Phone size={15} />} label="الهاتف" value={lead.phone} />
              <InfoRow icon={<Mail size={15} />} label="البريد" value={lead.email ?? "غير مسجل"} />
              <InfoRow
                icon={<UserRound size={15} />}
                label="العمر"
                value={lead.learner_age ? `${lead.learner_age} سنة` : "غير محدد"}
              />
              <InfoRow
                icon={<CalendarClock size={15} />}
                label="الوقت المفضل"
                value={lead.preferred_schedule ?? "غير محدد"}
              />
            </dl>
            {lead.notes ? (
              <div className="mt-4 rounded-xl border border-navy/[0.055] bg-cloud/60 p-3">
                <p className="text-[8px] font-semibold text-slate">ملاحظات</p>
                <p className="mt-1 text-[9px] leading-5 text-ink">{lead.notes}</p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <FollowUpDialog
        open={activeDialog === "follow-up"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        onSuccess={refreshLead}
      />
      <NoteDialog
        open={activeDialog === "note"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        onSuccess={refreshLead}
      />
      <AssessmentDialog
        open={activeDialog === "assessment"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        levels={levels}
        onSuccess={refreshLead}
      />
      <OfferDialog
        open={activeDialog === "offer"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        cohorts={cohortsQuery.data?.data ?? []}
        onSuccess={refreshLead}
      />
      <TrialDialog
        open={activeDialog === "trial"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        cohorts={cohortsQuery.data?.data ?? []}
        onSuccess={refreshLead}
      />
      <SeatDialog
        open={activeDialog === "seat"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        cohorts={cohortsQuery.data?.data ?? []}
        onSuccess={refreshLead}
      />
      <ConvertDialog
        open={activeDialog === "convert"}
        onClose={() => setActiveDialog(null)}
        leadId={leadId}
        lead={lead}
        cohorts={cohortsQuery.data?.data ?? []}
        onSuccess={async () => {
          await refreshLead();
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["students"] }),
            queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
          ]);
        }}
      />
    </div>
  );
}

function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] leading-5 text-slate">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={16} />
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FollowUpDialog({
  open,
  onClose,
  leadId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => Promise<void>;
}) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/follow-ups`, {
        method: "POST",
        json: { subject, due_at: dueAt, priority },
      }),
    onSuccess: async () => {
      await onSuccess();
      setSubject("");
      setDueAt("");
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog open={open} onClose={onClose} title="إضافة متابعة" description="حدد الخطوة التالية وموعدها حتى لا تضيع أي فرصة.">
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <FormField label="موضوع المتابعة">
          <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الموعد">
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} required />
          </FormField>
          <FormField label="الأولوية">
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">مرتفعة</option>
              <option value="urgent">عاجلة</option>
            </select>
          </FormField>
        </div>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ المتابعة" />
      </form>
    </ActionDialog>
  );
}

function NoteDialog({
  open,
  onClose,
  leadId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => Promise<void>;
}) {
  const [title, setTitle] = useState("ملاحظة على العميل");
  const [details, setDetails] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/activities`, {
        method: "POST",
        json: {
          type: "contact",
          direction: "outbound",
          title,
          details,
          channel,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setDetails("");
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog open={open} onClose={onClose} title="تسجيل تواصل أو ملاحظة" description="أضف ملخصًا واضحًا ليستطيع أي فرد من الفريق إكمال المتابعة.">
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <FormField label="عنوان النشاط">
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </FormField>
        <FormField label="قناة التواصل">
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">مكالمة هاتفية</option>
            <option value="email">بريد إلكتروني</option>
            <option value="in_person">مقابلة في الفرع</option>
          </select>
        </FormField>
        <FormField label="التفاصيل">
          <textarea rows={5} value={details} onChange={(event) => setDetails(event.target.value)} required />
        </FormField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ النشاط" />
      </form>
    </ActionDialog>
  );
}

function AssessmentDialog({
  open,
  onClose,
  leadId,
  levels,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  levels: LevelOption[];
  onSuccess: () => Promise<void>;
}) {
  const [status, setStatus] = useState("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");
  const [levelId, setLevelId] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/placement-assessment`, {
        method: "PUT",
        json: {
          status,
          scheduled_at: scheduledAt || null,
          completed_at: status === "completed" ? new Date().toISOString() : null,
          recommended_level_id: levelId || null,
          score: score ? Number(score) : null,
          notes: notes || null,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog open={open} onClose={onClose} title="اختبار المستوى" description="حدد الموعد، ثم أضف النتيجة والمستوى المقترح عند اكتماله.">
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الحالة">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="scheduled">مجدول</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="no_show">لم يحضر</option>
            </select>
          </FormField>
          <FormField label="الموعد">
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="المستوى المقترح">
            <select value={levelId} onChange={(event) => setLevelId(event.target.value)}>
              <option value="">لم يحدد</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.programName} · {level.name_ar}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="النتيجة من 100">
            <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />
          </FormField>
        </div>
        <FormField label="ملاحظات المقيم">
          <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="حفظ الاختبار" />
      </form>
    </ActionDialog>
  );
}

function OfferDialog({
  open,
  onClose,
  leadId,
  cohorts,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  cohorts: Cohort[];
  onSuccess: () => Promise<void>;
}) {
  const [cohortId, setCohortId] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [holdSeat, setHoldSeat] = useState(true);
  const [sendNow, setSendNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const availableCohorts = cohorts.filter((cohort) =>
    ["active", "enrolling"].includes(cohort.status),
  );
  const selectedCohort = availableCohorts.find((cohort) => cohort.id === cohortId);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/offers`, {
        method: "POST",
        json: {
          cohort_id: cohortId,
          price_amount: Number(price),
          discount_amount: Number(discount || 0),
          valid_until: validUntil || null,
          notes: notes || null,
          hold_seat: holdSeat,
          hold_hours: null,
          send_now: sendNow,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="إنشاء عرض تسجيل"
      description="حدد الجروب والسعر ومدة الصلاحية، ويمكن للنظام حجز المقعد مع العرض تلقائيًا."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <FormField label="الجروب المستهدف">
          <select
            value={cohortId}
            onChange={(event) => {
              const value = event.target.value;
              setCohortId(value);
              const cohort = availableCohorts.find((item) => item.id === value);
              if (cohort) setPrice(cohort.fee);
            }}
            required
          >
            <option value="">اختر الجروب</option>
            {availableCohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} · {cohort.available_seats} متاح
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="السعر">
            <input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </FormField>
          <FormField label="الخصم">
            <input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} />
          </FormField>
          <FormField label="صالح حتى (اختياري)">
            <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
          </FormField>
        </div>
        {selectedCohort ? (
          <div className="flex items-center justify-between rounded-xl bg-mist/60 p-3 text-[10px]">
            <span className="text-slate">صافي العرض</span>
            <span className="font-bold text-navy">
              {Math.max(0, Number(price || 0) - Number(discount || 0)).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        ) : null}
        <FormField label="ملاحظات العرض">
          <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-cloud/60 p-3 text-[9px] font-semibold text-navy">
            <input type="checkbox" checked={holdSeat} onChange={(event) => setHoldSeat(event.target.checked)} />
            حجز المقعد بالمدة الافتراضية
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-cloud/60 p-3 text-[9px] font-semibold text-navy">
            <input type="checkbox" checked={sendNow} onChange={(event) => setSendNow(event.target.checked)} />
            اعتماد وإرسال الآن
          </label>
        </div>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="إنشاء العرض" />
      </form>
    </ActionDialog>
  );
}

function TrialDialog({
  open,
  onClose,
  leadId,
  cohorts,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  cohorts: Cohort[];
  onSuccess: () => Promise<void>;
}) {
  const [cohortId, setCohortId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const availableCohorts = cohorts.filter((cohort) =>
    ["active", "enrolling"].includes(cohort.status),
  );
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/trials`, {
        method: "POST",
        json: {
          cohort_id: cohortId,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: Number(duration),
          notes: notes || null,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="حجز حصة تجريبية"
      description="اربط التجربة بجروب حقيقي ليظهر الموعد والمكان تلقائيًا لفريق القبول."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <FormField label="الجروب">
          <select value={cohortId} onChange={(event) => setCohortId(event.target.value)} required>
            <option value="">اختر الجروب المناسب</option>
            {availableCohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} · {cohort.delivery_mode === "online" ? "أونلاين" : "حضوري"}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="موعد التجربة">
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
          </FormField>
          <FormField label="المدة بالدقائق">
            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              <option value="30">30 دقيقة</option>
              <option value="45">45 دقيقة</option>
              <option value="60">60 دقيقة</option>
              <option value="90">90 دقيقة</option>
            </select>
          </FormField>
        </div>
        <FormField label="هدف التجربة أو ملاحظات">
          <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="تأكيد الحجز" />
      </form>
    </ActionDialog>
  );
}

function SeatDialog({
  open,
  onClose,
  leadId,
  cohorts,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  cohorts: Cohort[];
  onSuccess: () => Promise<void>;
}) {
  const [cohortId, setCohortId] = useState("");
  const [holdHours, setHoldHours] = useState("48");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const availableCohorts = cohorts.filter((cohort) =>
    ["active", "enrolling"].includes(cohort.status),
  );
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/leads/${leadId}/seat`, {
        method: "POST",
        json: {
          cohort_id: cohortId,
          hold_hours: Number(holdHours),
          notes: notes || null,
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="حجز مقعد أو إضافة للانتظار"
      description="لو السعة مكتملة، سيضيف النظام العميل لقائمة الانتظار تلقائيًا ويحفظ ترتيبه."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <FormField label="الجروب">
          <select value={cohortId} onChange={(event) => setCohortId(event.target.value)} required>
            <option value="">اختر الجروب</option>
            {availableCohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} · {cohort.available_seats} متاح · {cohort.waitlist_count} انتظار
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="مدة الحجز">
          <select value={holdHours} onChange={(event) => setHoldHours(event.target.value)}>
            <option value="24">24 ساعة</option>
            <option value="48">48 ساعة</option>
            <option value="72">3 أيام</option>
            <option value="168">أسبوع</option>
          </select>
        </FormField>
        <FormField label="ملاحظات">
          <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <DialogActions error={error} pending={mutation.isPending} submitLabel="تأكيد الإجراء" />
      </form>
    </ActionDialog>
  );
}

function ConvertDialog({
  open,
  onClose,
  leadId,
  lead,
  cohorts,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  leadId: string;
  lead: Lead;
  cohorts: Cohort[];
  onSuccess: () => Promise<void>;
}) {
  const [cohortId, setCohortId] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState(lead.phone);
  const [discount, setDiscount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<Student>>(`/api/v1/leads/${leadId}/convert`, {
        method: "POST",
        json: {
          cohort_id: cohortId,
          guardian_name: guardianName || null,
          guardian_phone: guardianPhone || null,
          discount_amount: Number(discount || 0),
        },
      }),
    onSuccess: async () => {
      await onSuccess();
      setError(null);
      onClose();
    },
    onError: (value) => setError(errorMessage(value)),
  });
  const selectedCohort = cohorts.find((cohort) => cohort.id === cohortId);

  return (
    <ActionDialog open={open} onClose={onClose} title="تسجيل العميل كطالب" description="اختر الجروب وأكد البيانات المالية؛ سيتم إنشاء ملف الطالب وإغلاق المتابعات المفتوحة.">
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="rounded-xl bg-mist/60 p-4">
          <p className="text-[9px] text-slate">الطالب</p>
          <p className="mt-1 text-xs font-bold text-navy">{lead.full_name}</p>
        </div>
        <FormField label="الجروب">
          <select value={cohortId} onChange={(event) => setCohortId(event.target.value)} required>
            <option value="">اختر جروبًا متاحًا</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} · {cohort.available_seats} أماكن
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="اسم ولي الأمر">
            <input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} />
          </FormField>
          <FormField label="هاتف ولي الأمر">
            <input dir="ltr" value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} />
          </FormField>
        </div>
        <FormField label="الخصم">
          <input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} />
        </FormField>
        {selectedCohort ? (
          <div className="flex items-center justify-between rounded-xl border border-navy/[0.06] bg-cloud p-3 text-[10px]">
            <span className="text-slate">صافي الرسوم</span>
            <span className="font-bold text-navy">
              {Math.max(0, Number(selectedCohort.fee) - Number(discount || 0)).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        ) : null}
        <DialogActions error={error} pending={mutation.isPending} submitLabel="إنشاء ملف الطالب" />
      </form>
    </ActionDialog>
  );
}

function DialogActions({
  error,
  pending,
  submitLabel,
}: {
  error: string | null;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Dialog.Close asChild>
          <Button variant="secondary">إلغاء</Button>
        </Dialog.Close>
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : submitLabel}
        </Button>
      </div>
    </>
  );
}

function FormField({ label, children }: { label: string; children: ReactElement }) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-semibold text-navy">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[11px] [&>input]:outline-none [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[11px] [&>select]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:p-3.5 [&>textarea]:text-[11px] [&>textarea]:outline-none">
        {children}
      </span>
    </label>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8 place-items-center rounded-lg bg-cloud text-slate">{icon}</div>
      <div className="min-w-0">
        <dt className="text-[8px] text-slate">{label}</dt>
        <dd className="mt-0.5 truncate text-[9px] font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

function JourneyRow({
  label,
  value,
  active,
  warning = false,
}: {
  label: string;
  value: string;
  active: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          active ? "bg-emerald-500" : warning ? "bg-amber-500" : "bg-slate-200"
        }`}
      />
      <div className="min-w-0">
        <p className="text-[8px] font-semibold text-slate">{label}</p>
        <p className="mt-1 text-[9px] leading-5 text-ink">{value}</p>
      </div>
    </div>
  );
}

function offerStatusLabel(status: string) {
  return (
    {
      draft: "مسودة",
      sent: "تم الإرسال",
      accepted: "تم القبول",
      declined: "مرفوض",
      expired: "منتهي",
      cancelled: "ملغي",
    }[status] ?? status
  );
}

function trialStatusLabel(status: string) {
  return (
    {
      scheduled: "مجدولة",
      confirmed: "مؤكدة",
      attended: "حضر",
      no_show: "لم يحضر",
      cancelled: "ملغاة",
    }[status] ?? status
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message;
  }

  return "تعذر حفظ التغييرات. حاول مرة أخرى.";
}

function LeadDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-24 rounded-2xl bg-white" />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="h-[620px] rounded-2xl bg-white" />
        <div className="space-y-5">
          <div className="h-72 rounded-2xl bg-white" />
          <div className="h-52 rounded-2xl bg-white" />
        </div>
      </div>
    </div>
  );
}
