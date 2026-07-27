<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Finance\StorePaymentRequest;
use App\Http\Resources\Api\V1\Finance\InvoiceResource;
use App\Models\Invoice;
use App\Modules\Finance\Actions\RecordInvoicePayment;

class PaymentController extends Controller
{
    public function store(
        StorePaymentRequest $request,
        Invoice $invoice,
        RecordInvoicePayment $recordPayment,
    ): InvoiceResource {
        $recordPayment->execute($invoice, $request->validated(), $request->user());

        return new InvoiceResource(
            $invoice->fresh()
                ->load(['student', 'enrollment.cohort', 'payments.recorder'])
                ->loadSum('payments', 'amount'),
        );
    }
}
