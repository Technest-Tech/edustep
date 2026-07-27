<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Enums\ExpenseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Finance\StoreExpenseRequest;
use App\Http\Requests\Api\V1\Finance\UpdateExpenseStatusRequest;
use App\Http\Resources\Api\V1\Finance\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Expense::query()
            ->with(['creator:id,name', 'approver:id,name'])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('category')->toString(), fn ($query, string $category) => $query->where('category', $category))
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('expense_number', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('vendor_name', 'like', "%{$search}%");
                });
            })
            ->latest('incurred_on');

        return ExpenseResource::collection(
            $query->paginate(min(max($request->integer('per_page', 20), 5), 100)),
        );
    }

    public function store(StoreExpenseRequest $request): ExpenseResource
    {
        $data = $request->validated();
        $sequence = Expense::query()
            ->whereYear('created_at', now()->year)
            ->count() + 1;
        $data['expense_number'] = sprintf('EXP-%s-%04d', now()->format('Y'), $sequence);
        $data['created_by'] = $request->user()->id;
        $data['status'] ??= ExpenseStatus::Submitted;

        return new ExpenseResource(
            Expense::query()->create($data)->load(['creator:id,name', 'approver:id,name']),
        );
    }

    public function updateStatus(
        UpdateExpenseStatusRequest $request,
        Expense $expense,
    ): ExpenseResource {
        $status = ExpenseStatus::from($request->validated('status'));
        $user = $request->user();

        if (
            in_array($status, [ExpenseStatus::Approved, ExpenseStatus::Rejected], true)
            && $user->role !== 'owner'
        ) {
            abort(403, 'اعتماد أو رفض المصروف يتطلب صلاحية مدير الأكاديمية.');
        }

        if ($status === ExpenseStatus::Paid && $expense->status !== ExpenseStatus::Approved) {
            throw ValidationException::withMessages([
                'status' => 'يجب اعتماد المصروف قبل تسجيل دفعه.',
            ]);
        }

        $data = ['status' => $status];

        if ($status === ExpenseStatus::Approved) {
            $data['approved_by'] = $user->id;
            $data['approved_at'] = now();
        }

        if ($status === ExpenseStatus::Paid) {
            $data['payment_method'] = $request->validated('payment_method');
            $data['paid_at'] = now();
        }

        if ($request->filled('notes')) {
            $data['notes'] = $request->validated('notes');
        }

        $expense->update($data);

        return new ExpenseResource(
            $expense->fresh()->load(['creator:id,name', 'approver:id,name']),
        );
    }
}
