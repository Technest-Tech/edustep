<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;

class FinanceSummaryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $invoices = Invoice::query()
            ->where('status', '!=', 'cancelled')
            ->withSum('payments', 'amount')
            ->get();

        $billed = (float) $invoices->sum('total_amount');
        $collected = (float) $invoices->sum(fn ($invoice) => (float) ($invoice->payments_sum_amount ?? 0));
        $overdue = (float) $invoices
            ->filter(fn ($invoice) => $invoice->due_on->isPast() && $invoice->status->value !== 'paid')
            ->sum(fn ($invoice) => max(0, (float) $invoice->total_amount - (float) ($invoice->payments_sum_amount ?? 0)));

        return response()->json([
            'data' => [
                'billed' => number_format($billed, 2, '.', ''),
                'collected' => number_format($collected, 2, '.', ''),
                'outstanding' => number_format(max(0, $billed - $collected), 2, '.', ''),
                'overdue' => number_format($overdue, 2, '.', ''),
                'collection_rate' => $billed > 0 ? round(($collected / $billed) * 100, 1) : 0,
                'payments_this_month' => number_format(
                    (float) Payment::query()
                        ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->sum('amount'),
                    2,
                    '.',
                    '',
                ),
            ],
        ]);
    }
}
