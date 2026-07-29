"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type {
  ApiCollection,
  ApiItem,
  Guardian,
  Message,
  MessageTemplate,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleAlert,
  Clock3,
  Mail,
  MessageCircleMore,
  MessagesSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useMemo, useState, type FormEvent } from "react";

const channels = [
  { value: "", label: "كل القنوات" },
  { value: "internal", label: "داخل البوابة" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "البريد" },
  { value: "sms", label: "SMS" },
] as const;

const channelLabels: Record<string, string> = {
  internal: "داخل البوابة",
  whatsapp: "WhatsApp",
  email: "البريد الإلكتروني",
  sms: "SMS",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  queued: "في قائمة الانتظار",
  sent: "تم الإرسال",
  delivered: "تم التسليم",
  read: "تمت القراءة",
  failed: "فشل الإرسال",
};

export function CommunicationsContent() {
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const query = useQuery({
    queryKey: ["messages", channel, search],
    queryFn: () => {
      const params = new URLSearchParams({ per_page: "100" });
      if (channel) params.set("channel", channel);
      if (search.trim()) params.set("search", search.trim());

      return apiClient<ApiCollection<Message>>(`/api/v1/messages?${params}`);
    },
  });
  const messages = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const summary = useMemo(
    () => ({
      total: messages.length,
      delivered: messages.filter((message) =>
        ["sent", "delivered", "read"].includes(message.status),
      ).length,
      queued: messages.filter((message) => message.status === "queued").length,
    }),
    [messages],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication Hub · سجل تواصل موحد"
        title="مركز التواصل"
        description="أنشئ الرسالة مرة واحدة، احتفظ بسجلها مع الطالب وولي الأمر، وفعّل قنوات الإرسال الرسمية عند ربطها."
        actions={
          <>
            <Button variant="secondary" onClick={() => query.refetch()}>
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              تحديث
            </Button>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus size={15} className="text-sun" />
              رسالة جديدة
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <CommunicationMetric
          icon={MessagesSquare}
          label="الرسائل الظاهرة"
          value={summary.total}
          hint="حسب الفلتر الحالي"
          tone="bg-[#edf2fb] text-navy"
        />
        <CommunicationMetric
          icon={ShieldCheck}
          label="تم إرسالها أو تسليمها"
          value={summary.delivered}
          hint="داخل البوابة أو عبر مزوّد"
          tone="bg-emerald-50 text-emerald-700"
        />
        <CommunicationMetric
          icon={Clock3}
          label="بانتظار الربط"
          value={summary.queued}
          hint="قنوات خارجية غير مفعلة"
          tone="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-[12px] font-bold text-amber-950">
              الإرسال الخارجي محفوظ كـ “في قائمة الانتظار”
            </p>
            <p className="mt-1 text-[11px] leading-5 text-amber-800">
              النظام لا يدّعي إرسال WhatsApp أو البريد قبل ربط حساب مزوّد رسمي وتسجيل نتيجة التسليم.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-navy/[0.065] bg-white shadow-[0_12px_40px_rgba(11,36,84,.04)]">
        <div className="flex flex-col gap-4 border-b border-navy/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-cloud p-1">
            {channels.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setChannel(item.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
                  channel === item.value ? "bg-navy text-white" : "text-slate hover:text-navy"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-navy/[0.08] bg-cloud px-3 sm:w-72">
            <Search size={15} className="text-slate" />
            <span className="sr-only">بحث في الرسائل</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="اسم ولي الأمر أو الطالب..."
              className="min-w-0 flex-1 bg-transparent text-[12px] text-navy outline-none"
            />
          </label>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-cloud" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-12 text-center">
            <CircleAlert className="mx-auto text-rose-500" size={27} />
            <p className="mt-3 text-[12px] font-semibold text-navy">تعذر تحميل سجل الرسائل</p>
          </div>
        ) : messages.length ? (
          <div className="divide-y divide-navy/[0.055]">
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="p-14 text-center">
            <MessageCircleMore className="mx-auto text-teal" size={30} />
            <p className="mt-4 text-xs font-bold text-navy">لا توجد رسائل بهذا الفلتر</p>
            <Button className="mt-4" onClick={() => setComposeOpen(true)}>
              إنشاء أول رسالة
            </Button>
          </div>
        )}
      </section>

      <ComposeMessageDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  const Icon =
    message.channel === "email"
      ? Mail
      : message.channel === "internal"
        ? MessagesSquare
        : Smartphone;

  return (
    <article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:px-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cloud text-teal">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] font-bold text-navy">
            {message.guardian?.name ?? "ولي الأمر"}
          </p>
          <span className="text-[11px] text-slate">·</span>
          <p className="text-[11px] font-semibold text-teal">
            {channelLabels[message.channel]}
          </p>
          <StatusBadge
            value={message.status}
            label={statusLabels[message.status] ?? message.status}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate">
          {message.student?.full_name ?? "رسالة عامة"} · {formatDateTime(message.created_at)}
        </p>
        {message.subject ? (
          <p className="mt-3 text-[12px] font-bold text-navy">{message.subject}</p>
        ) : null}
        <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate">{message.body}</p>
        {!message.provider_connected ? (
          <p className="mt-2 text-[11px] font-semibold text-amber-700">
            محفوظ وبانتظار ربط مزوّد {channelLabels[message.channel]}.
          </p>
        ) : null}
      </div>
      <div className="sm:text-left">
        <p className="text-[11px] text-slate">بواسطة</p>
        <p className="mt-1 text-[12px] font-semibold text-navy">
          {message.sender?.name ?? "النظام"}
        </p>
      </div>
    </article>
  );
}

function ComposeMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [guardianId, setGuardianId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [channel, setChannel] = useState<Message["channel"]>("internal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const guardiansQuery = useQuery({
    queryKey: ["guardians"],
    queryFn: () => apiClient<ApiItem<Guardian[]>>("/api/v1/guardians"),
    enabled: open,
  });
  const templatesQuery = useQuery({
    queryKey: ["message-templates"],
    queryFn: () =>
      apiClient<ApiItem<MessageTemplate[]>>("/api/v1/message-templates"),
    enabled: open,
  });
  const guardians = guardiansQuery.data?.data ?? [];
  const templates = templatesQuery.data?.data ?? [];
  const selectedGuardian = guardians.find((guardian) => guardian.id === guardianId);
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient<ApiItem<Message>>("/api/v1/messages", {
        method: "POST",
        json: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
      reset();
      onOpenChange(false);
    },
  });

  function reset() {
    setGuardianId("");
    setStudentId("");
    setTemplateId("");
    setChannel("internal");
    setSubject("");
    setBody("");
    setError(null);
  }

  function chooseGuardian(value: string) {
    setGuardianId(value);
    const guardian = guardians.find((item) => item.id === value);
    setStudentId(guardian?.students[0]?.id ?? "");
  }

  function chooseTemplate(value: string) {
    setTemplateId(value);
    const template = templates.find((item) => item.id === value);
    if (!template) return;

    setChannel(template.channel);
    setSubject(template.subject ?? "");
    setBody(template.body);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await mutation.mutateAsync({
        guardian_id: guardianId,
        student_id: studentId || undefined,
        message_template_id: templateId || undefined,
        channel,
        subject: subject || undefined,
        body: body || undefined,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? Object.values(caught.errors).flat()[0] ?? caught.message
          : "تعذر حفظ الرسالة.",
      );
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) reset();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,680px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/30 bg-white p-5 shadow-[0_28px_90px_rgba(11,36,84,.25)] outline-none sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">
                رسالة جديدة
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] leading-5 text-slate">
                اختر ولي الأمر والطالب ثم القناة أو قالبًا جاهزًا.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl bg-cloud text-slate"
                aria-label="إغلاق"
              >
                <X size={17} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ولي الأمر">
                <select
                  required
                  value={guardianId}
                  onChange={(event) => chooseGuardian(event.target.value)}
                  className="field-control"
                >
                  <option value="">اختر ولي الأمر</option>
                  {guardians.map((guardian) => (
                    <option key={guardian.id} value={guardian.id}>
                      {guardian.name} · {guardian.phone}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="الطالب">
                <select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  className="field-control"
                >
                  <option value="">رسالة عامة للأسرة</option>
                  {selectedGuardian?.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="قالب جاهز">
                <select
                  value={templateId}
                  onChange={(event) => chooseTemplate(event.target.value)}
                  className="field-control"
                >
                  <option value="">بدون قالب</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="قناة التواصل">
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as Message["channel"])}
                  className="field-control"
                >
                  {channels.slice(1).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {channel !== "internal" ? (
              <div className="flex gap-3 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
                <Clock3 size={15} className="mt-0.5 shrink-0" />
                ستُحفظ الرسالة في قائمة الانتظار حتى ربط مزوّد {channelLabels[channel]} الرسمي.
              </div>
            ) : null}

            <Field label="عنوان الرسالة (اختياري)">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="field-control"
                placeholder="مثال: تحديث التقدم الأسبوعي"
              />
            </Field>
            <Field label="نص الرسالة">
              <textarea
                required={!templateId}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="field-control min-h-32 resize-y py-3"
                placeholder="اكتب رسالة واضحة ومباشرة لولي الأمر..."
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="secondary">إلغاء</Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending || !guardianId}>
                <Send size={15} className="text-sun" />
                {mutation.isPending
                  ? "جاري الحفظ..."
                  : channel === "internal"
                    ? "إرسال داخل البوابة"
                    : "إضافة لقائمة الانتظار"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

function CommunicationMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof MessagesSquare;
  label: string;
  value: number;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-center gap-4">
        <span className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={19} />
        </span>
        <div>
          <p className="text-lg font-bold text-navy">{value}</p>
          <p className="text-[12px] font-semibold text-slate">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate/70">{hint}</p>
    </article>
  );
}
