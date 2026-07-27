<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Finance\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Invoice::query()
            ->with(['student', 'enrollment.cohort', 'payments.recorder'])
            ->withSum('payments', 'amount')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('student', function ($query) use ($search): void {
                            $query
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%")
                                ->orWhere('student_code', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->boolean('overdue'), fn ($query) => $query
                ->whereDate('due_on', '<', today())
                ->whereNotIn('status', ['paid', 'cancelled']))
            ->orderByRaw("case when status = 'overdue' then 0 when status = 'partially_paid' then 1 else 2 end")
            ->latest('issued_on');

        return InvoiceResource::collection(
            $query->paginate(min(max($request->integer('per_page', 20), 5), 100)),
        );
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource(
            $invoice->load(['student', 'enrollment.cohort', 'payments.recorder'])->loadSum('payments', 'amount'),
        );
    }
}
