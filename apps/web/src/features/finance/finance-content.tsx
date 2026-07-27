"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiClient, ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type {
  ApiCollection,
  ApiItem,
  FinanceSummary,
  Invoice,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  Landmark,
  ReceiptText,
  RefreshCw,
  Search,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useDeferredValue, useState, type ReactElement } from "react";

const invoiceStatuses = [
  ["all", "كل الفواتير"],
  ["issued", "مستحقة"],
  ["partially_paid", "مدفوعة جزئيًا"],
  ["paid", "مدفوعة"],
  ["overdue", "متأخرة"],
] as const;

const invoiceStatusLabels: Record<string, string> = {
  draft: "مسودة",
  issued: "مستحقة",
  partially_paid: "مدفوعة جزئيًا",
  paid: "مدفوعة",
  overdue: "متأخرة",
  cancelled: "ملغاة",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "نقدي",
  bank_transfer: "تحويل بنكي",
  instapay: "InstaPay",
  card: "بطاقة",
};

export function FinanceContent() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const deferredSearch = useDeferredValue(search);
  const summaryQuery = useQuery({
    queryKey: ["finance", "summary"],
    queryFn: () => apiClient<ApiItem<FinanceSummary>>("/api/v1/finance/summary"),
  });
  const invoicesQuery = useQuery({
    queryKey: ["finance", "invoices", deferredSearch, status, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "15",
      });
      if (deferredSearch) params.set("search", deferredSearch);
      if (status !== "all") params.set("status", status);

      return apiClient<ApiCollection<Invoice>>(`/api/v1/finance/invoices?${params}`);
    },
  });
  const summary = summaryQuery.data?.data;
  const invoices = invoicesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance · الحسابات والتحصيل"
        title="الحسابات والتحصيل"
        description="متابعة الفواتير والمدفوعات والمبالغ المتأخرة، وتسجيل الدفعات من شاشة واحدة."
        actions={
          <Button
            variant="secondary"
            onClick={() => Promise.all([summaryQuery.refetch(), invoicesQuery.refetch()])}
          >
            <RefreshCw
              size={15}
              className={
                summaryQuery.isFetching || invoicesQuery.isFetching ? "animate-spin" : ""
              }
            />
            تحديث
          </Button>
        }
      />

      {summaryQuery.isLoading ? (
        <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white" />
          ))}
        </div>
      ) : summaryQuery.isError || !summary ? (
        <div className="rounded-2xl border border-rose-100 bg-white p-5 text-xs text-rose-700">
          تعذر تحميل الملخص المالي.
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FinanceMetric
            icon={CircleDollarSign}
            label="إجمالي الفواتير"
            value={formatCurrency(summary.billed)}
            hint="كل الفواتير غير الملغاة"
            tone="bg-[#edf2fb] text-navy"
          />
          <FinanceMetric
            icon={TrendingUp}
            label="تم تحصيله"
            value={formatCurrency(summary.collected)}
            hint={`${summary.collection_rate}% نسبة التحصيل`}
            tone="bg-emerald-50 text-emerald-700"
          />
          <FinanceMetric
            icon={WalletCards}
            label="الرصيد المستحق"
            value={formatCurrency(summary.outstanding)}
            hint="ما زال قيد التحصيل"
            tone="bg-amber-50 text-amber-700"
          />
          <FinanceMetric
            icon={CircleAlert}
            label="متأخر"
            value={formatCurrency(summary.overdue)}
            hint="يحتاج متابعة عاجلة"
            tone="bg-rose-50 text-rose-700"
          />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
        <div className="border-b border-navy/[0.055] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex min-h-11 flex-1 items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud/70 px-3.5 text-slate">
              <Search size={17} />
              <span className="sr-only">البحث في الفواتير</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="ابحث باسم الطالب، الكود، الهاتف، أو رقم الفاتورة..."
                className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none"
              />
            </label>
            <div className="thin-scrollbar flex gap-2 overflow-x-auto pb-1">
              {invoiceStatuses.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-semibold transition ${
                    status === value
                      ? "bg-navy text-white shadow-sm"
                      : "border border-navy/[0.07] bg-white text-slate hover:bg-cloud"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {invoicesQuery.isLoading ? (
          <div className="animate-pulse space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 rounded-xl bg-cloud" />
            ))}
          </div>
        ) : invoicesQuery.isError ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <CircleAlert className="mx-auto text-rose-500" size={28} />
              <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل الفواتير</p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => invoicesQuery.refetch()}
              >
                إعادة المحاولة
              </Button>
            </div>
          </div>
        ) : invoices.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="bg-cloud/55 text-right text-[9px] font-semibold text-slate">
                    <th className="px-5 py-3.5">الفاتورة والطالب</th>
                    <th className="px-4 py-3.5">الحالة</th>
                    <th className="px-4 py-3.5">الاستحقاق</th>
                    <th className="px-4 py-3.5">الإجمالي</th>
                    <th className="px-4 py-3.5">تم تحصيله</th>
                    <th className="px-4 py-3.5">المتبقي</th>
                    <th className="px-5 py-3.5 text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      onPayment={() => setSelectedInvoice(invoice)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-navy/[0.05] md:hidden">
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPayment={() => setSelectedInvoice(invoice)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <ReceiptText className="mx-auto text-teal" size={30} />
              <p className="mt-3 text-xs font-semibold text-navy">لا توجد فواتير مطابقة</p>
            </div>
          </div>
        )}

        {invoicesQuery.data?.meta && invoicesQuery.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-navy/[0.055] px-5 py-4">
            <p className="text-[9px] text-slate">
              عرض {invoicesQuery.data.meta.from}–{invoicesQuery.data.meta.to} من{" "}
              {invoicesQuery.data.meta.total}
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
                disabled={page >= invoicesQuery.data.meta.last_page}
                onClick={() => setPage((value) => value + 1)}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft size={15} />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedInvoice ? (
        <PaymentDialog
          invoice={selectedInvoice}
          open
          onClose={() => setSelectedInvoice(null)}
        />
      ) : null}
    </div>
  );
}

function InvoiceRow({
  invoice,
  onPayment,
}: {
  invoice: Invoice;
  onPayment: () => void;
}) {
  return (
    <tr className="transition hover:bg-cloud/60">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-teal">
            <ReceiptText size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold text-navy">{invoice.invoice_number}</p>
            <p className="mt-1 truncate text-[10px] font-medium text-ink">
              {invoice.student.full_name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          value={invoice.status}
          label={invoiceStatusLabels[invoice.status] ?? invoice.status}
        />
      </td>
      <td className={`px-4 py-4 text-[9px] ${invoice.is_overdue ? "font-semibold text-rose-600" : "text-slate"}`}>
        {formatDate(invoice.due_on)}
      </td>
      <td className="px-4 py-4 text-[10px] font-medium text-ink">
        {formatCurrency(invoice.total_amount)}
      </td>
      <td className="px-4 py-4 text-[10px] font-medium text-emerald-700">
        {formatCurrency(invoice.paid_amount)}
      </td>
      <td className="px-4 py-4 text-[10px] font-bold text-navy">
        {formatCurrency(invoice.balance)}
      </td>
      <td className="px-5 py-4 text-left">
        <Button
          size="sm"
          variant={Number(invoice.balance) > 0 ? "primary" : "secondary"}
          disabled={Number(invoice.balance) <= 0}
          onClick={onPayment}
        >
          <Banknote size={14} />
          تسجيل دفعة
        </Button>
      </td>
    </tr>
  );
}

function InvoiceCard({
  invoice,
  onPayment,
}: {
  invoice: Invoice;
  onPayment: () => void;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-bold text-navy">{invoice.invoice_number}</p>
          <p className="mt-1 text-[11px] font-semibold text-ink">{invoice.student.full_name}</p>
          <p className="mt-1 text-[8px] text-slate">{invoice.enrollment?.cohort?.name}</p>
        </div>
        <StatusBadge
          value={invoice.status}
          label={invoiceStatusLabels[invoice.status] ?? invoice.status}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-cloud p-3">
        <MoneyItem label="الإجمالي" value={invoice.total_amount} />
        <MoneyItem label="تم تحصيله" value={invoice.paid_amount} />
        <MoneyItem label="المتبقي" value={invoice.balance} highlight />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-[8px] ${invoice.is_overdue ? "text-rose-600" : "text-slate"}`}>
          الاستحقاق: {formatDate(invoice.due_on)}
        </p>
        <Button
          size="sm"
          disabled={Number(invoice.balance) <= 0}
          onClick={onPayment}
        >
          تسجيل دفعة
        </Button>
      </div>
    </article>
  );
}

function PaymentDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(invoice.balance);
  const [method, setMethod] = useState("instapay");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<Invoice>>(`/api/v1/finance/invoices/${invoice.id}/payments`, {
        method: "POST",
        json: {
          amount: Number(amount),
          method,
          reference: reference || null,
          notes: notes || null,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["finance"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      onClose();
    },
    onError: (value) => {
      if (value instanceof ApiError) {
        setError(Object.values(value.errors)[0]?.[0] ?? value.message);
      } else {
        setError("تعذر تسجيل الدفعة. حاول مرة أخرى.");
      }
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-[540px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">تسجيل دفعة</Dialog.Title>
              <Dialog.Description className="mt-1 text-[9px] leading-5 text-slate">
                ستضاف الدفعة إلى سجل الطالب وتُحدث حالة الفاتورة تلقائيًا.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-5 rounded-2xl bg-navy p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] text-white/45">{invoice.invoice_number}</p>
                <p className="mt-1 text-xs font-semibold">{invoice.student.full_name}</p>
              </div>
              <div className="text-left">
                <p className="text-[8px] text-white/45">الرصيد المتبقي</p>
                <p className="mt-1 text-sm font-bold text-sun">
                  {formatCurrency(invoice.balance)}
                </p>
              </div>
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              mutation.mutate();
            }}
          >
            <PaymentField label="قيمة الدفعة">
              <input
                type="number"
                min="1"
                max={invoice.balance}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </PaymentField>
            <div>
              <span className="mb-2 block text-[10px] font-semibold text-navy">
                طريقة الدفع
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["cash", Banknote],
                  ["instapay", WalletCards],
                  ["bank_transfer", Landmark],
                  ["card", CreditCard],
                ].map(([value, Icon]) => {
                  const PaymentIcon = Icon as typeof Banknote;

                  return (
                    <button
                      key={value as string}
                      type="button"
                      onClick={() => setMethod(value as string)}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border text-[8px] font-medium transition ${
                        method === value
                          ? "border-teal bg-mist text-navy"
                          : "border-navy/[0.07] bg-white text-slate hover:bg-cloud"
                      }`}
                    >
                      <PaymentIcon size={17} />
                      {paymentMethodLabels[value as string]}
                    </button>
                  );
                })}
              </div>
            </div>
            <PaymentField label="رقم العملية أو المرجع">
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="اختياري"
              />
            </PaymentField>
            <PaymentField label="ملاحظات">
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="أي تفاصيل إضافية..."
              />
            </PaymentField>

            {invoice.payments.length ? (
              <div className="rounded-xl border border-navy/[0.06] bg-cloud p-3">
                <p className="text-[8px] font-semibold text-navy">آخر دفعة مسجلة</p>
                <p className="mt-1 text-[8px] text-slate">
                  {formatCurrency(invoice.payments.at(-1)?.amount ?? 0)} ·{" "}
                  {formatDateTime(invoice.payments.at(-1)?.paid_at ?? null)}
                </p>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button variant="secondary">إلغاء</Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "جاري التسجيل..." : "تأكيد الدفعة"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaymentField({ label, children }: { label: string; children: ReactElement }) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-semibold text-navy">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[11px] [&>input]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:p-3.5 [&>textarea]:text-[11px] [&>textarea]:outline-none">
        {children}
      </span>
    </label>
  );
}

function FinanceMetric({
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
    <article className="rounded-2xl border border-navy/[0.065] bg-white p-5 shadow-[0_8px_28px_rgba(11,36,84,.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] text-slate">{label}</p>
          <p className="mt-2 text-lg font-bold tracking-tight text-navy">{value}</p>
        </div>
        <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 border-t border-navy/[0.055] pt-3 text-[8px] text-slate">{hint}</p>
    </article>
  );
}

function MoneyItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[8px] text-slate">{label}</p>
      <p className={`mt-1 text-[9px] font-bold ${highlight ? "text-navy" : "text-ink"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
