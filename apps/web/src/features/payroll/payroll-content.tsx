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
  Expense,
  PayrollData,
  TeacherEarning,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCheck,
  CircleAlert,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  FileClock,
  Plus,
  ReceiptText,
  RefreshCw,
  Send,
  WalletCards,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

const earningStatusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  paid: "تم الدفع",
  void: "ملغي",
};

const expenseStatusLabels: Record<string, string> = {
  draft: "مسودة",
  submitted: "بانتظار الاعتماد",
  approved: "معتمد",
  paid: "مدفوع",
  rejected: "مرفوض",
};

const expenseCategories = [
  "إيجارات",
  "تسويق",
  "منصات وبرامج",
  "أدوات تعليمية",
  "مرافق",
  "صيانة",
  "إدارية",
  "أخرى",
];

export function PayrollContent() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<"payroll" | "expenses">("payroll");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const range = useMemo(() => monthRange(month), [month]);
  const payrollQuery = useQuery({
    queryKey: ["payroll", range.from, range.to],
    queryFn: () =>
      apiClient<ApiItem<PayrollData>>(
        `/api/v1/finance/payroll?from=${range.from}&to=${range.to}`,
      ),
  });
  const expensesQuery = useQuery({
    queryKey: ["expenses", month],
    queryFn: () =>
      apiClient<ApiCollection<Expense>>("/api/v1/finance/expenses?per_page=100"),
  });
  const payroll = payrollQuery.data?.data;
  const expenses = expensesQuery.data?.data ?? [];
  const monthExpenses = expenses.filter((expense) => expense.incurred_on.startsWith(month));
  const paidExpenses = monthExpenses
    .filter((expense) => expense.status === "paid")
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  function refreshAll() {
    return Promise.all([payrollQuery.refetch(), expensesQuery.refetch()]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance Operations · ضبط التكاليف"
        title="المصروفات ومستحقات المعلمين"
        description="كل حصة مكتملة تنشئ مستحقًا قابلًا للتتبع، مع دورة اعتماد واضحة للمصروفات والمدفوعات."
        actions={
          <>
            <Button variant="secondary" onClick={refreshAll}>
              <RefreshCw
                size={15}
                className={
                  payrollQuery.isFetching || expensesQuery.isFetching ? "animate-spin" : ""
                }
              />
              تحديث
            </Button>
            <Button onClick={() => setExpenseDialogOpen(true)}>
              <Plus size={15} className="text-sun" />
              مصروف جديد
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_30px_rgba(11,36,84,.035)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold text-slate">فترة المراجعة</p>
          <p className="mt-1 text-xs font-bold text-navy">
            {new Date(`${month}-01T12:00:00`).toLocaleDateString("ar-EG", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-cloud px-3 py-2">
          <FileClock size={16} className="text-teal" />
          <span className="sr-only">شهر المراجعة</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="bg-transparent text-[10px] font-semibold text-navy outline-none"
          />
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <PayrollMetric
          icon={Coins}
          label="إجمالي المستحقات"
          value={formatCurrency(payroll?.summary.total ?? 0)}
          hint={`${payroll?.summary.sessions ?? 0} حصة`}
          tone="bg-[#edf2fb] text-navy"
        />
        <PayrollMetric
          icon={FileClock}
          label="قيد المراجعة"
          value={formatCurrency(payroll?.summary.pending ?? 0)}
          hint="تحتاج اعتماد"
          tone="bg-amber-50 text-amber-700"
        />
        <PayrollMetric
          icon={ClipboardCheck}
          label="تم اعتمادها"
          value={formatCurrency(payroll?.summary.approved ?? 0)}
          hint="جاهزة للدفع"
          tone="bg-violet-50 text-violet-700"
        />
        <PayrollMetric
          icon={WalletCards}
          label="تم دفعه"
          value={formatCurrency(payroll?.summary.paid ?? 0)}
          hint="للمعلمين"
          tone="bg-emerald-50 text-emerald-700"
        />
        <PayrollMetric
          icon={ReceiptText}
          label="مصروفات مدفوعة"
          value={formatCurrency(paidExpenses)}
          hint="خلال الشهر"
          tone="bg-rose-50 text-rose-700"
        />
      </section>

      <div className="flex w-fit rounded-xl border border-navy/[0.07] bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={`rounded-lg px-4 py-2 text-[10px] font-semibold transition ${
            activeTab === "payroll" ? "bg-navy text-white" : "text-slate hover:text-navy"
          }`}
        >
          مستحقات المعلمين
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`rounded-lg px-4 py-2 text-[10px] font-semibold transition ${
            activeTab === "expenses" ? "bg-navy text-white" : "text-slate hover:text-navy"
          }`}
        >
          المصروفات
        </button>
      </div>

      {activeTab === "payroll" ? (
        <PayrollPanel payroll={payroll} loading={payrollQuery.isLoading} />
      ) : (
        <ExpensesPanel
          expenses={monthExpenses}
          loading={expensesQuery.isLoading}
          onAdd={() => setExpenseDialogOpen(true)}
        />
      )}

      {payroll?.summary.missing_rates ? (
        <section className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <CircleAlert size={19} className="shrink-0 text-amber-700" />
          <div>
            <p className="text-[10px] font-bold text-amber-900">
              {payroll.summary.missing_rates} مستحق بدون قاعدة سعر
            </p>
            <p className="mt-1 text-[8px] text-amber-800">
              راجع ملف المعلم وحدد سعر الساعة قبل اعتماد دورة الرواتب.
            </p>
          </div>
        </section>
      ) : null}

      <AddExpenseDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} />
    </div>
  );
}

function PayrollPanel({
  payroll,
  loading,
}: {
  payroll: PayrollData | undefined;
  loading: boolean;
}) {
  if (loading) return <PanelSkeleton />;

  if (!payroll) {
    return <EmptyPanel message="تعذر تحميل مستحقات المعلمين." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {payroll.teachers.map((row) => (
          <article
            key={row.teacher.id}
            className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-navy text-sm font-bold text-white">
                {row.teacher.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-navy">{row.teacher.name}</p>
                <p className="mt-1 text-[8px] text-slate">{row.sessions} حصص مكتملة</p>
              </div>
              <p className="text-sm font-bold text-teal">{formatCurrency(row.total)}</p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniAmount label="قيد المراجعة" value={row.pending} />
              <MiniAmount label="معتمد" value={row.approved} />
              <MiniAmount label="مدفوع" value={row.paid} />
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
        <div className="border-b border-navy/[0.055] p-5">
          <h2 className="text-sm font-bold text-navy">سجل المستحقات</h2>
          <p className="mt-1 text-[8px] text-slate">
            كل مبلغ مرتبط بالحصة والسعر المستخدم في الحساب.
          </p>
        </div>
        {payroll.earnings.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-cloud/55 text-right text-[8px] font-semibold text-slate">
                    <th className="px-5 py-3.5">المعلم والحصة</th>
                    <th className="px-4 py-3.5">التاريخ</th>
                    <th className="px-4 py-3.5">طريقة الحساب</th>
                    <th className="px-4 py-3.5">المبلغ</th>
                    <th className="px-4 py-3.5">الحالة</th>
                    <th className="px-5 py-3.5 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {payroll.earnings.map((earning) => (
                    <EarningRow key={earning.id} earning={earning} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-navy/[0.05] md:hidden">
              {payroll.earnings.map((earning) => (
                <EarningCard key={earning.id} earning={earning} />
              ))}
            </div>
          </>
        ) : (
          <EmptyPanel message="لا توجد مستحقات في هذه الفترة." />
        )}
      </section>
    </div>
  );
}

function EarningRow({ earning }: { earning: TeacherEarning }) {
  return (
    <tr className="transition hover:bg-cloud/50">
      <td className="px-5 py-4">
        <p className="text-[10px] font-bold text-navy">{earning.teacher.name}</p>
        <p className="mt-1 text-[8px] text-slate">
          {earning.session.cohort?.name} · {earning.session.title}
        </p>
      </td>
      <td className="px-4 py-4 text-[9px] text-slate">{formatDate(earning.earned_on)}</td>
      <td className="px-4 py-4">
        <p className="text-[9px] font-semibold text-navy">
          {earning.rate_type === "hourly" ? "بالساعة" : "سعر الحصة"}
        </p>
        <p className="mt-1 text-[8px] text-slate">{earning.duration_minutes} دقيقة</p>
      </td>
      <td className="px-4 py-4 text-[10px] font-bold text-navy">
        {formatCurrency(earning.amount)}
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          value={earning.status}
          label={earningStatusLabels[earning.status] ?? earning.status}
        />
      </td>
      <td className="px-5 py-4 text-left">
        <EarningActions earning={earning} />
      </td>
    </tr>
  );
}

function EarningCard({ earning }: { earning: TeacherEarning }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-navy">{earning.teacher.name}</p>
          <p className="mt-1 text-[8px] text-slate">{earning.session.cohort?.name}</p>
        </div>
        <StatusBadge
          value={earning.status}
          label={earningStatusLabels[earning.status] ?? earning.status}
        />
      </div>
      <div className="mt-4 flex items-end justify-between rounded-xl bg-cloud p-3">
        <div>
          <p className="text-[8px] text-slate">{formatDate(earning.earned_on)}</p>
          <p className="mt-1 text-sm font-bold text-navy">{formatCurrency(earning.amount)}</p>
        </div>
        <EarningActions earning={earning} />
      </div>
    </article>
  );
}

function EarningActions({ earning }: { earning: TeacherEarning }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: "approved" | "paid") =>
      apiClient<ApiItem<TeacherEarning>>(
        `/api/v1/finance/teacher-earnings/${earning.id}/status`,
        { method: "PATCH", json: { status } },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll"] }),
  });

  if (earning.status === "pending" && user?.role === "owner") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate("approved")}
      >
        <CheckCheck size={13} />
        اعتماد
      </Button>
    );
  }

  if (earning.status === "approved") {
    return (
      <Button
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate("paid")}
      >
        <Banknote size={13} className="text-sun" />
        تسجيل الدفع
      </Button>
    );
  }

  return <span className="text-[8px] text-slate">لا يوجد إجراء</span>;
}

function ExpensesPanel({
  expenses,
  loading,
  onAdd,
}: {
  expenses: Expense[];
  loading: boolean;
  onAdd: () => void;
}) {
  if (loading) return <PanelSkeleton />;

  return (
    <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
      <div className="flex items-start justify-between gap-3 border-b border-navy/[0.055] p-5">
        <div>
          <h2 className="text-sm font-bold text-navy">سجل المصروفات</h2>
          <p className="mt-1 text-[8px] text-slate">
            من التسجيل إلى الاعتماد ثم الدفع، بدون حذف التاريخ المالي.
          </p>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus size={13} />
          إضافة
        </Button>
      </div>
      {expenses.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-cloud/55 text-right text-[8px] font-semibold text-slate">
                  <th className="px-5 py-3.5">المصروف</th>
                  <th className="px-4 py-3.5">التصنيف</th>
                  <th className="px-4 py-3.5">التاريخ</th>
                  <th className="px-4 py-3.5">المبلغ</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {expenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-navy/[0.05] md:hidden">
            {expenses.map((expense) => (
              <article key={expense.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-navy">{expense.description}</p>
                    <p className="mt-1 text-[8px] text-slate">
                      {expense.vendor_name ?? expense.category}
                    </p>
                  </div>
                  <StatusBadge
                    value={expense.status}
                    label={expenseStatusLabels[expense.status] ?? expense.status}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-cloud p-3">
                  <p className="text-sm font-bold text-navy">{formatCurrency(expense.amount)}</p>
                  <ExpenseActions expense={expense} />
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyPanel message="لا توجد مصروفات في هذا الشهر." />
      )}
    </section>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <tr className="transition hover:bg-cloud/50">
      <td className="px-5 py-4">
        <p className="text-[10px] font-bold text-navy">{expense.description}</p>
        <p className="mt-1 font-mono text-[8px] text-slate">
          {expense.expense_number} {expense.vendor_name ? `· ${expense.vendor_name}` : ""}
        </p>
      </td>
      <td className="px-4 py-4 text-[9px] text-slate">{expense.category}</td>
      <td className="px-4 py-4 text-[9px] text-slate">{formatDate(expense.incurred_on)}</td>
      <td className="px-4 py-4 text-[10px] font-bold text-navy">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          value={expense.status}
          label={expenseStatusLabels[expense.status] ?? expense.status}
        />
      </td>
      <td className="px-5 py-4 text-left">
        <ExpenseActions expense={expense} />
      </td>
    </tr>
  );
}

function ExpenseActions({ expense }: { expense: Expense }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: { status: "approved" | "paid"; payment_method?: string }) =>
      apiClient<ApiItem<Expense>>(`/api/v1/finance/expenses/${expense.id}/status`, {
        method: "PATCH",
        json: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  if (expense.status === "submitted" && user?.role === "owner") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ status: "approved" })}
      >
        <CheckCheck size={13} />
        اعتماد
      </Button>
    );
  }

  if (expense.status === "approved") {
    return (
      <Button
        size="sm"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({ status: "paid", payment_method: "bank_transfer" })
        }
      >
        <Banknote size={13} className="text-sun" />
        تسجيل الدفع
      </Button>
    );
  }

  return <span className="text-[8px] text-slate">لا يوجد إجراء</span>;
}

function AddExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(expenseCategories[0]);
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<Expense>>("/api/v1/finance/expenses", {
        method: "POST",
        json: {
          category,
          vendor_name: vendor || null,
          description,
          amount: Number(amount),
          incurred_on: incurredOn,
          status: "submitted",
          notes: notes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setVendor("");
      setDescription("");
      setAmount("");
      setNotes("");
      onOpenChange(false);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  const error = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,590px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-bold text-navy">
                تسجيل مصروف جديد
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] text-slate">
                سيُرسل المصروف للمراجعة قبل تسجيل الدفع.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <ExpenseField label="التصنيف">
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {expenseCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </ExpenseField>
            <ExpenseField label="المورد">
              <input
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
                placeholder="اسم المورد أو الجهة"
              />
            </ExpenseField>
            <ExpenseField label="وصف المصروف" className="sm:col-span-2">
              <input
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="مثال: اشتراك منصة الاجتماعات"
              />
            </ExpenseField>
            <ExpenseField label="المبلغ">
              <input
                required
                min="1"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </ExpenseField>
            <ExpenseField label="تاريخ المصروف">
              <input
                required
                type="date"
                value={incurredOn}
                onChange={(event) => setIncurredOn(event.target.value)}
              />
            </ExpenseField>
            <ExpenseField label="ملاحظات" className="sm:col-span-2">
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="تفاصيل إضافية أو مرجع داخلي..."
              />
            </ExpenseField>

            {error ? (
              <p className="rounded-xl bg-rose-50 p-3 text-[9px] text-rose-700 sm:col-span-2">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-navy/[0.06] pt-5 sm:col-span-2">
              <Dialog.Close asChild>
                <Button variant="secondary">إلغاء</Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                <Send size={14} className="text-sun" />
                {mutation.isPending ? "جارٍ الحفظ..." : "حفظ وإرسال للمراجعة"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExpenseField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={`grid gap-2 text-[9px] font-semibold text-navy ${className ?? ""} [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:border [&_input]:border-navy/[0.08] [&_input]:bg-cloud/60 [&_input]:px-3 [&_input]:text-[10px] [&_input]:font-normal [&_input]:outline-none [&_select]:min-h-11 [&_select]:rounded-xl [&_select]:border [&_select]:border-navy/[0.08] [&_select]:bg-cloud/60 [&_select]:px-3 [&_select]:text-[10px] [&_select]:font-normal [&_select]:outline-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-navy/[0.08] [&_textarea]:bg-cloud/60 [&_textarea]:p-3 [&_textarea]:text-[10px] [&_textarea]:font-normal [&_textarea]:outline-none`}
    >
      {label}
      {children}
    </label>
  );
}

function PayrollMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className={`grid size-10 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 truncate text-base font-bold text-navy">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-ink">{label}</p>
      <p className="mt-1 text-[7px] text-slate">{hint}</p>
    </article>
  );
}

function MiniAmount({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cloud/80 p-2.5 text-center">
      <p className="truncate text-[9px] font-bold text-navy">{formatCurrency(value)}</p>
      <p className="mt-1 text-[7px] text-slate">{label}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="grid min-h-52 place-items-center p-8 text-center">
      <div>
        <ReceiptText className="mx-auto text-teal" size={27} />
        <p className="mt-3 text-[10px] font-semibold text-navy">{message}</p>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white" />
    </div>
  );
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);

  return {
    from: `${month}-01`,
    to: `${month}-${String(end.getDate()).padStart(2, "0")}`,
  };
}
