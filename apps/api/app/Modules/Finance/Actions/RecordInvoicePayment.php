<?php

namespace App\Modules\Finance\Actions;

use App\Enums\InstallmentStatus;
use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordInvoicePayment
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(Invoice $invoice, array $data, User $recorder): Payment
    {
        return DB::transaction(function () use ($invoice, $data, $recorder): Payment {
            /** @var Invoice $lockedInvoice */
            $lockedInvoice = Invoice::query()
                ->withSum('payments', 'amount')
                ->lockForUpdate()
                ->findOrFail($invoice->id);

            if (in_array($lockedInvoice->status, [InvoiceStatus::Paid, InvoiceStatus::Cancelled], true)) {
                throw ValidationException::withMessages([
                    'amount' => ['لا يمكن إضافة دفعة لهذه الفاتورة.'],
                ]);
            }

            $remaining = (float) $lockedInvoice->total_amount - (float) ($lockedInvoice->payments_sum_amount ?? 0);

            if ((float) $data['amount'] > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => ['قيمة الدفعة أكبر من الرصيد المتبقي.'],
                ]);
            }

            $payment = Payment::query()->create([
                'invoice_id' => $lockedInvoice->id,
                'student_id' => $lockedInvoice->student_id,
                'recorded_by' => $recorder->id,
                'payment_number' => 'PAY-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                'amount' => $data['amount'],
                'method' => $data['method'],
                'paid_at' => $data['paid_at'] ?? now(),
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $newPaidAmount = (float) ($lockedInvoice->payments_sum_amount ?? 0) + (float) $payment->amount;
            $paidInFull = $newPaidAmount >= (float) $lockedInvoice->total_amount;
            $lockedInvoice->update([
                'status' => $paidInFull
                    ? InvoiceStatus::Paid
                    : InvoiceStatus::PartiallyPaid,
            ]);
            $lockedInvoice->subscriptionInstallment()->update([
                'status' => $paidInFull
                    ? InstallmentStatus::Paid
                    : InstallmentStatus::PartiallyPaid,
                'paid_at' => $paidInFull ? now() : null,
            ]);

            return $payment;
        });
    }
}
