"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiClient } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  ApiCollection,
  ApiItem,
  Program,
  Student,
  StudentSubscription,
  StudyPackage,
  SubscriptionsData,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  CircleAlert,
  CircleDollarSign,
  Layers3,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useState, type ReactNode } from "react";

const statusLabels: Record<string, string> = {
  scheduled: "يبدأ قريبًا",
  active: "نشط",
  frozen: "مجمّد",
  expiring: "قارب على الانتهاء",
  renewed: "تم تجديده",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const installmentLabels: Record<string, string> = {
  pending: "قادم",
  invoiced: "مستحق",
  partially_paid: "مدفوع جزئيًا",
  paid: "مدفوع",
  waived: "معفى",
  overdue: "متأخر",
};

type ActiveDialog =
  | { type: "new-subscription" }
  | { type: "new-package" }
  | { type: "renew"; subscription: StudentSubscription }
  | { type: "freeze"; subscription: StudentSubscription }
  | null;

export function SubscriptionsContent() {
  const { user } = useAuth();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["subscriptions", status, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      return apiClient<ApiItem<SubscriptionsData>>(
        `/api/v1/billing/subscriptions?${params}`,
      );
    },
  });
  const data = query.data?.data;
  const statusMutation = useMutation({
    mutationFn: ({
      subscription,
      target,
    }: {
      subscription: StudentSubscription;
      target: "active" | "completed" | "cancelled";
    }) =>
      apiClient(`/api/v1/billing/subscriptions/${subscription.id}/status`, {
        method: "PATCH",
        json: { status: target },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Enrollment & Billing · دورة الاشتراك"
        title="الاشتراكات والتجديد"
        description="الباقات، مدة الاشتراك، الأقساط، التجميد والتجديد في دورة تشغيل واحدة مرتبطة بالفواتير."
        actions={
          <>
            <Button variant="secondary" onClick={() => query.refetch()}>
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              تحديث
            </Button>
            {["owner", "academic_manager"].includes(user?.role ?? "") ? (
              <Button
                variant="secondary"
                onClick={() => setActiveDialog({ type: "new-package" })}
              >
                <Layers3 size={15} />
                باقة جديدة
              </Button>
            ) : null}
            <Button onClick={() => setActiveDialog({ type: "new-subscription" })}>
              <Plus size={15} className="text-sun" />
              اشتراك جديد
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SubscriptionMetric
          icon={UsersRound}
          label="اشتراكات نشطة"
          value={data?.summary.active ?? 0}
          hint={`من ${data?.summary.total ?? 0} اشتراكات`}
          tone="bg-sky-50 text-sky-700"
        />
        <SubscriptionMetric
          icon={PauseCircle}
          label="اشتراكات مجمّدة"
          value={data?.summary.frozen ?? 0}
          hint="تحتاج متابعة موعد العودة"
          tone="bg-violet-50 text-violet-700"
        />
        <SubscriptionMetric
          icon={RotateCcw}
          label="تجديد مطلوب"
          value={data?.summary.renewal_due ?? 0}
          hint="خلال 14 يومًا"
          tone="bg-amber-50 text-amber-700"
        />
        <SubscriptionMetric
          icon={CircleDollarSign}
          label="رصيد الأقساط"
          value={formatCurrency(data?.summary.outstanding ?? 0)}
          hint="مبالغ لم تُحصّل"
          tone="bg-rose-50 text-rose-700"
          wide
        />
      </section>

      <section className="rounded-3xl border border-navy/[0.065] bg-white p-5 shadow-[0_12px_40px_rgba(11,36,84,.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy">الباقات المتاحة</h2>
            <p className="mt-1 text-[9px] text-slate">السعر والمدة وعدد الحصص وخطة التقسيط الافتراضية</p>
          </div>
          <span className="rounded-full bg-cloud px-3 py-1.5 text-[9px] font-semibold text-slate">
            {data?.packages.length ?? 0} باقات
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.packages ?? []).map((studyPackage) => (
            <PackageCard key={studyPackage.id} studyPackage={studyPackage} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-navy/[0.065] bg-white shadow-[0_12px_40px_rgba(11,36,84,.04)]">
        <div className="flex flex-col gap-4 border-b border-navy/[0.055] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy">اشتراكات الطلاب</h2>
            <p className="mt-1 text-[9px] text-slate">المتابعة المالية والتشغيلية لكل اشتراك</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl bg-cloud px-3 sm:w-64">
              <Search size={15} className="text-slate" />
              <span className="sr-only">بحث في الاشتراكات</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="الطالب، الكود أو الهاتف..."
                className="min-w-0 flex-1 bg-transparent text-[9px] text-navy outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border-0 bg-cloud px-3 text-[9px] font-semibold text-navy outline-none"
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="frozen">مجمّد</option>
              <option value="expiring">قارب على الانتهاء</option>
              <option value="scheduled">يبدأ قريبًا</option>
              <option value="renewed">تم تجديده</option>
            </select>
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-cloud" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-12 text-center">
            <CircleAlert className="mx-auto text-rose-500" size={28} />
            <p className="mt-3 text-[10px] font-semibold text-navy">
              تعذر تحميل الاشتراكات
            </p>
          </div>
        ) : data?.subscriptions.length ? (
          <div className="divide-y divide-navy/[0.055]">
            {data.subscriptions.map((subscription) => (
              <SubscriptionRow
                key={subscription.id}
                subscription={subscription}
                busy={statusMutation.isPending}
                onRenew={() => setActiveDialog({ type: "renew", subscription })}
                onFreeze={() => setActiveDialog({ type: "freeze", subscription })}
                onReactivate={() =>
                  statusMutation.mutate({ subscription, target: "active" })
                }
              />
            ))}
          </div>
        ) : (
          <div className="p-14 text-center">
            <BadgeDollarSign className="mx-auto text-teal" size={30} />
            <p className="mt-4 text-xs font-bold text-navy">
              لا توجد اشتراكات بهذا الفلتر
            </p>
            <Button
              className="mt-4"
              onClick={() => setActiveDialog({ type: "new-subscription" })}
            >
              إضافة اشتراك
            </Button>
          </div>
        )}
      </section>

      <NewSubscriptionDialog
        open={activeDialog?.type === "new-subscription"}
        packages={data?.packages ?? []}
        subscriptions={data?.subscriptions ?? []}
        onClose={() => setActiveDialog(null)}
      />
      <NewPackageDialog
        open={activeDialog?.type === "new-package"}
        onClose={() => setActiveDialog(null)}
      />
      {activeDialog?.type === "renew" ? (
        <RenewDialog
          subscription={activeDialog.subscription}
          packages={data?.packages ?? []}
          open
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
      {activeDialog?.type === "freeze" ? (
        <FreezeDialog
          subscription={activeDialog.subscription}
          open
          onClose={() => setActiveDialog(null)}
        />
      ) : null}
    </div>
  );
}

function PackageCard({ studyPackage }: { studyPackage: StudyPackage }) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-cloud/45 p-4 transition hover:border-teal/25 hover:bg-white hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-semibold text-teal">
            {studyPackage.program.name_ar} · {studyPackage.level?.name_ar ?? "كل المستويات"}
          </p>
          <h3 className="mt-2 text-[11px] font-bold text-navy">{studyPackage.name}</h3>
          <p className="mt-1 font-mono text-[8px] text-slate">{studyPackage.code}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-teal">
          <Layers3 size={17} />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <PackageStat label="الحصص" value={studyPackage.sessions_count} />
        <PackageStat label="المدة" value={`${studyPackage.duration_weeks} أسبوع`} />
        <PackageStat label="الأقساط" value={studyPackage.default_installments} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[8px] text-slate">سعر الإطلاق</p>
          <p className="mt-1 text-base font-bold text-navy">
            {formatCurrency(studyPackage.price)}
          </p>
          {studyPackage.standard_price ? (
            <p className="mt-1 text-[8px] text-slate line-through">
              الأساسي {formatCurrency(studyPackage.standard_price)}
            </p>
          ) : null}
        </div>
        <div className="text-left">
          <p className="text-[8px] text-slate">الدفع الكامل</p>
          <p className="mt-1 text-[10px] font-bold text-emerald-700">
            {formatCurrency(studyPackage.full_payment_price)}
          </p>
          <p className="mt-1 text-[8px] text-slate">{studyPackage.subscriptions_count} اشتراكات</p>
        </div>
      </div>
    </article>
  );
}

function SubscriptionRow({
  subscription,
  busy,
  onRenew,
  onFreeze,
  onReactivate,
}: {
  subscription: StudentSubscription;
  busy: boolean;
  onRenew: () => void;
  onFreeze: () => void;
  onReactivate: () => void;
}) {
  const paidPercent = Number(subscription.net_amount)
    ? Math.min(
        100,
        Math.round((Number(subscription.paid_amount) / Number(subscription.net_amount)) * 100),
      )
    : 100;
  const canRenew = ["active", "expiring", "completed"].includes(subscription.status);

  return (
    <article className="p-5 sm:px-6">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.8fr_1fr_auto] xl:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-sm font-bold text-white">
            {subscription.student.full_name.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[11px] font-bold text-navy">
                {subscription.student.full_name}
              </p>
              <StatusBadge
                value={subscription.status}
                label={statusLabels[subscription.status] ?? subscription.status}
              />
            </div>
            <p className="mt-1 text-[8px] text-slate">
              {subscription.student.student_code} · {subscription.enrollment?.cohort?.name}
            </p>
            <p className="mt-2 text-[9px] font-semibold text-teal">
              {subscription.package.name}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[8px] text-slate">الفترة</p>
          <p className="mt-1 text-[9px] font-semibold text-navy">
            {formatDate(subscription.starts_on)} — {formatDate(subscription.ends_on)}
          </p>
          <p className="mt-2 text-[8px] text-slate">
            {subscription.status === "frozen"
              ? `مجمّد حتى ${formatDate(subscription.frozen_until)}`
              : `${subscription.days_remaining} يوم متبقي`}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-slate">التحصيل</p>
            <p className="text-[9px] font-bold text-navy">{paidPercent}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cloud">
            <div
              className="h-full rounded-full bg-teal"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[8px] text-slate">
            {formatCurrency(subscription.paid_amount)} من{" "}
            {formatCurrency(subscription.net_amount)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subscription.installments.map((installment) => (
              <span
                key={installment.id}
                className={`rounded-md px-2 py-1 text-[7px] font-semibold ${
                  installment.status === "paid"
                    ? "bg-emerald-50 text-emerald-700"
                    : installment.status === "overdue"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700"
                }`}
                title={`${installmentLabels[installment.status]} · ${formatDate(installment.due_on)}`}
              >
                ق{installment.installment_number} · {installmentLabels[installment.status]}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {subscription.status === "frozen" ? (
            <Button size="sm" variant="secondary" disabled={busy} onClick={onReactivate}>
              <PlayCircle size={14} />
              إعادة تفعيل
            </Button>
          ) : ["active", "expiring"].includes(subscription.status) ? (
            <Button size="sm" variant="ghost" onClick={onFreeze}>
              <PauseCircle size={14} />
              تجميد
            </Button>
          ) : null}
          {canRenew ? (
            <Button size="sm" onClick={onRenew}>
              <RotateCcw size={14} className="text-sun" />
              تجديد
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function NewSubscriptionDialog({
  open,
  packages,
  subscriptions,
  onClose,
}: {
  open: boolean;
  packages: StudyPackage[];
  subscriptions: StudentSubscription[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [startsOn, setStartsOn] = useState(todayValue());
  const [paymentPlan, setPaymentPlan] = useState<"installments" | "full" | "custom">(
    "installments",
  );
  const [installmentCount, setInstallmentCount] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const studentsQuery = useQuery({
    queryKey: ["students", "subscription-dialog"],
    queryFn: () => apiClient<ApiCollection<Student>>("/api/v1/students?per_page=100"),
    enabled: open,
  });
  const openStudentIds = new Set(
    subscriptions
      .filter((subscription) =>
        ["scheduled", "active", "frozen", "expiring"].includes(subscription.status),
      )
      .map((subscription) => subscription.student.id),
  );
  const availableStudents = (studentsQuery.data?.data ?? []).filter(
    (student) => !openStudentIds.has(student.id) && student.enrollments?.length,
  );
  const selectedStudent = availableStudents.find((student) => student.id === studentId);
  const selectedPackage = packages.find((item) => item.id === packageId);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient('/api/v1/billing/subscriptions', {
        method: "POST",
        json: {
          student_id: studentId,
          enrollment_id: enrollmentId,
          study_package_id: packageId,
          starts_on: startsOn,
          payment_plan: paymentPlan,
          installment_count: Number(installmentCount),
          discount_amount: paymentPlan === "custom" ? Number(discount || 0) : 0,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      reset();
      onClose();
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  function chooseStudent(value: string) {
    setStudentId(value);
    const student = availableStudents.find((item) => item.id === value);
    setEnrollmentId(student?.enrollments?.[0]?.id ?? "");
  }

  function choosePackage(value: string) {
    setPackageId(value);
    const item = packages.find((candidate) => candidate.id === value);
    setInstallmentCount(String(item?.default_installments ?? 1));
    setPaymentPlan("installments");
    setDiscount("0");
  }

  function reset() {
    setStudentId("");
    setEnrollmentId("");
    setPackageId("");
    setStartsOn(todayValue());
    setPaymentPlan("installments");
    setInstallmentCount("1");
    setDiscount("0");
    setError(null);
  }

  return (
    <FormDialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="اشتراك جديد"
      description="اختر الطالب والباقة؛ سيُنشئ النظام الأقساط والفواتير تلقائيًا."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          mutation.mutate();
        }}
      >
        <DialogError value={error} />
        <Field label="الطالب">
          <select
            required
            value={studentId}
            onChange={(event) => chooseStudent(event.target.value)}
            className="field-control"
          >
            <option value="">اختر طالبًا بدون اشتراك مفتوح</option>
            {availableStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} · {student.student_code}
              </option>
            ))}
          </select>
        </Field>
        {selectedStudent?.enrollments?.length ? (
          <Field label="التسجيل والجروب">
            <select
              required
              value={enrollmentId}
              onChange={(event) => setEnrollmentId(event.target.value)}
              className="field-control"
            >
              {selectedStudent.enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.cohort?.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="الباقة">
          <select
            required
            value={packageId}
            onChange={(event) => choosePackage(event.target.value)}
            className="field-control"
          >
            <option value="">اختر الباقة</option>
            {packages.filter((item) => item.is_active).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {formatCurrency(item.price)}
              </option>
            ))}
          </select>
        </Field>
        {selectedPackage ? (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cloud p-3 sm:grid-cols-4">
            <PackageStat label="الحصص" value={selectedPackage.sessions_count} />
            <PackageStat label="الأسابيع" value={selectedPackage.duration_weeks} />
            <PackageStat label="سعر الإطلاق" value={formatCurrency(selectedPackage.price)} />
            <PackageStat
              label="الدفع الكامل"
              value={formatCurrency(selectedPackage.full_payment_price)}
            />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="تاريخ البداية">
            <input
              type="date"
              required
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="طريقة الدفع">
            <select
              value={paymentPlan}
              onChange={(event) => {
                const plan = event.target.value as "installments" | "full" | "custom";
                setPaymentPlan(plan);
                if (plan === "full") {
                  setInstallmentCount("1");
                } else if (plan === "installments") {
                  setInstallmentCount(String(selectedPackage?.default_installments ?? 2));
                }
              }}
              className="field-control"
            >
              <option value="installments">دفعتان حسب سياسة الأكاديمية</option>
              <option value="full">دفع كامل بخصم 5%</option>
              <option value="custom">خطة خاصة بموافقة الإدارة</option>
            </select>
          </Field>
        </div>
        {selectedPackage && paymentPlan !== "custom" ? (
          <div className="rounded-2xl border border-teal/15 bg-mist/55 p-4 text-[10px] leading-6 text-navy">
            {paymentPlan === "full" ? (
              <>
                سيُنشأ قسط واحد بقيمة{" "}
                <strong>{formatCurrency(selectedPackage.full_payment_price)}</strong> بعد تطبيق خصم{" "}
                {selectedPackage.full_payment_discount_percent}% تلقائيًا.
              </>
            ) : (
              <>
                سيُنشئ النظام {selectedPackage.default_installments} دفعات بقيمة تقريبية{" "}
                <strong>{formatCurrency(selectedPackage.default_installment_amount)}</strong> للدفعة،
                وتستحق الثانية قبل الحصة {selectedPackage.second_installment_session ?? 9}.
              </>
            )}
          </div>
        ) : null}
        {paymentPlan === "custom" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عدد الأقساط">
              <select
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                className="field-control"
              >
                {[1, 2, 3, 4, 6].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="خصم خاص">
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="field-control"
              />
            </Field>
          </div>
        ) : null}
        <DialogActions
          submitting={mutation.isPending}
          submitLabel="إنشاء الاشتراك والفواتير"
          onCancel={onClose}
        />
      </form>
    </FormDialog>
  );
}

function RenewDialog({
  subscription,
  packages,
  open,
  onClose,
}: {
  subscription: StudentSubscription;
  packages: StudyPackage[];
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const initialPackage =
    packages.find(
      (item) => item.id === subscription.package.id && item.is_active,
    ) ?? packages.find((item) => item.is_active);
  const [packageId, setPackageId] = useState(initialPackage?.id ?? "");
  const [startsOn, setStartsOn] = useState(nextDay(subscription.ends_on));
  const [paymentPlan, setPaymentPlan] = useState<
    "installments" | "full" | "custom"
  >("installments");
  const [installmentCount, setInstallmentCount] = useState(
    String(initialPackage?.default_installments ?? 2),
  );
  const [discount, setDiscount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const selectedPackage = packages.find((item) => item.id === packageId);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/billing/subscriptions/${subscription.id}/renew`, {
        method: "POST",
        json: {
          study_package_id: packageId,
          starts_on: startsOn,
          payment_plan: paymentPlan,
          installment_count: Number(installmentCount),
          discount_amount: paymentPlan === "custom" ? Number(discount || 0) : 0,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onClose();
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`تجديد اشتراك ${subscription.student.full_name}`}
      description="سيُحفظ الاشتراك الحالي ويُنشأ اشتراك جديد مرتبط به."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <DialogError value={error} />
        <Field label="باقة التجديد">
          <select
            required
            value={packageId}
            onChange={(event) => {
              const value = event.target.value;
              const item = packages.find((candidate) => candidate.id === value);
              setPackageId(value);
              setPaymentPlan("installments");
              setInstallmentCount(String(item?.default_installments ?? 2));
              setDiscount("0");
            }}
            className="field-control"
          >
            {packages.filter((item) => item.is_active).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {formatCurrency(item.price)}
              </option>
            ))}
          </select>
        </Field>
        {selectedPackage ? (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cloud p-3 sm:grid-cols-4">
            <PackageStat label="الحصص" value={selectedPackage.sessions_count} />
            <PackageStat label="الأسابيع" value={selectedPackage.duration_weeks} />
            <PackageStat
              label="سعر الإطلاق"
              value={formatCurrency(selectedPackage.price)}
            />
            <PackageStat
              label="الدفع الكامل"
              value={formatCurrency(selectedPackage.full_payment_price)}
            />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="بداية التجديد">
            <input
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="طريقة الدفع">
            <select
              value={paymentPlan}
              onChange={(event) => {
                const plan = event.target.value as
                  | "installments"
                  | "full"
                  | "custom";
                setPaymentPlan(plan);
                if (plan === "full") {
                  setInstallmentCount("1");
                } else if (plan === "installments") {
                  setInstallmentCount(
                    String(selectedPackage?.default_installments ?? 2),
                  );
                }
              }}
              className="field-control"
            >
              <option value="installments">دفعتان حسب سياسة الأكاديمية</option>
              <option value="full">دفع كامل بخصم 5%</option>
              <option value="custom">خطة خاصة بموافقة الإدارة</option>
            </select>
          </Field>
        </div>
        {selectedPackage && paymentPlan !== "custom" ? (
          <div className="rounded-2xl border border-teal/15 bg-mist/55 p-4 text-[10px] leading-6 text-navy">
            {paymentPlan === "full" ? (
              <>
                سيُنشأ قسط واحد بقيمة{" "}
                <strong>{formatCurrency(selectedPackage.full_payment_price)}</strong>{" "}
                بعد تطبيق خصم {selectedPackage.full_payment_discount_percent}% تلقائيًا.
              </>
            ) : (
              <>
                سيُنشئ النظام {selectedPackage.default_installments} دفعات بقيمة تقريبية{" "}
                <strong>
                  {formatCurrency(selectedPackage.default_installment_amount)}
                </strong>{" "}
                للدفعة، وتستحق الثانية قبل الحصة{" "}
                {selectedPackage.second_installment_session ?? 9}.
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عدد الأقساط">
              <select
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                className="field-control"
              >
                {[1, 2, 3, 4, 6].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="خصم خاص">
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="field-control"
              />
            </Field>
          </div>
        )}
        <DialogActions
          submitting={mutation.isPending}
          submitLabel="تأكيد التجديد"
          onCancel={onClose}
        />
      </form>
    </FormDialog>
  );
}

function FreezeDialog({
  subscription,
  open,
  onClose,
}: {
  subscription: StudentSubscription;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [frozenUntil, setFrozenUntil] = useState(() => futureDate(7));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/billing/subscriptions/${subscription.id}/status`, {
        method: "PATCH",
        json: {
          status: "frozen",
          frozen_until: frozenUntil,
          notes: notes || undefined,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onClose();
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`تجميد اشتراك ${subscription.student.full_name}`}
      description="عند إعادة التفعيل سيُمدد تاريخ نهاية الاشتراك بعدد أيام التجميد الفعلية."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <DialogError value={error} />
        <Field label="مجمّد حتى">
          <input
            type="date"
            required
            min={futureDate(1)}
            value={frozenUntil}
            onChange={(event) => setFrozenUntil(event.target.value)}
            className="field-control"
          />
        </Field>
        <Field label="سبب أو ملاحظات">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="field-control min-h-24"
            placeholder="مثال: سفر مؤقت بطلب ولي الأمر"
          />
        </Field>
        <DialogActions
          submitting={mutation.isPending}
          submitLabel="تأكيد التجميد"
          onCancel={onClose}
        />
      </form>
    </FormDialog>
  );
}

function NewPackageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("16");
  const [weeks, setWeeks] = useState("8");
  const [price, setPrice] = useState("");
  const [installments, setInstallments] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const programsQuery = useQuery({
    queryKey: ["programs", "package-dialog"],
    queryFn: () => apiClient<ApiCollection<Program>>("/api/v1/programs"),
    enabled: open,
  });
  const program = programsQuery.data?.data.find((item) => item.id === programId);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient('/api/v1/billing/packages', {
        method: "POST",
        json: {
          program_id: programId,
          level_id: levelId || undefined,
          code,
          name,
          sessions_count: Number(sessions),
          duration_weeks: Number(weeks),
          price: Number(price),
          default_installments: Number(installments),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onClose();
    },
    onError: (caught) => setError(errorMessage(caught)),
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="باقة دراسة جديدة"
      description="عرّف عدد الحصص والمدة والسعر وخطة التقسيط الافتراضية."
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <DialogError value={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="البرنامج">
            <select
              required
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                setLevelId("");
              }}
              className="field-control"
            >
              <option value="">اختر البرنامج</option>
              {programsQuery.data?.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_ar}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المستوى">
            <select
              value={levelId}
              onChange={(event) => setLevelId(event.target.value)}
              className="field-control"
            >
              <option value="">كل المستويات</option>
              {program?.levels?.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name_ar}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الباقة">
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-control"
              placeholder="مثال: باقة A2 · 16 حصة"
            />
          </Field>
          <Field label="كود الباقة">
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="field-control"
              placeholder="A2-16"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="الحصص">
            <input
              type="number"
              min="1"
              value={sessions}
              onChange={(event) => setSessions(event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="الأسابيع">
            <input
              type="number"
              min="1"
              value={weeks}
              onChange={(event) => setWeeks(event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="السعر">
            <input
              required
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="field-control"
            />
          </Field>
          <Field label="الأقساط">
            <input
              type="number"
              min="1"
              max="12"
              value={installments}
              onChange={(event) => setInstallments(event.target.value)}
              className="field-control"
            />
          </Field>
        </div>
        <DialogActions
          submitting={mutation.isPending}
          submitLabel="حفظ الباقة"
          onCancel={onClose}
        />
      </form>
    </FormDialog>
  );
}

function FormDialog({
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
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/30 bg-white p-5 shadow-[0_28px_90px_rgba(11,36,84,.25)] outline-none sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] leading-5 text-slate">
                {description}
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
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogActions({
  submitting,
  submitLabel,
  onCancel,
}: {
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onCancel}>
        إلغاء
      </Button>
      <Button type="submit" disabled={submitting}>
        <Sparkles size={15} className="text-sun" />
        {submitting ? "جاري الحفظ..." : submitLabel}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

function DialogError({ value }: { value: string | null }) {
  return value ? (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[9px] text-rose-700">
      {value}
    </div>
  ) : null;
}

function SubscriptionMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  wide = false,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
  wide?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_28px_rgba(11,36,84,.035)] ${
        wide ? "col-span-2 xl:col-span-2" : ""
      }`}
    >
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon size={17} />
      </span>
      <p className="mt-4 text-lg font-bold text-navy">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-slate">{label}</p>
      <p className="mt-1 text-[8px] text-slate/70">{hint}</p>
    </article>
  );
}

function PackageStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-2.5 text-center">
      <p className="text-[9px] font-bold text-navy">{value}</p>
      <p className="mt-1 text-[7px] text-slate">{label}</p>
    </div>
  );
}

function errorMessage(caught: unknown) {
  if (caught instanceof ApiError) {
    return Object.values(caught.errors).flat()[0] ?? caught.message;
  }

  return "تعذر إكمال العملية. حاول مرة أخرى.";
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function nextDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}
