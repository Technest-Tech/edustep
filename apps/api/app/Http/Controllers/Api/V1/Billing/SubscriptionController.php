<?php

namespace App\Http\Controllers\Api\V1\Billing;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Billing\RenewSubscriptionRequest;
use App\Http\Requests\Api\V1\Billing\StoreSubscriptionRequest;
use App\Http\Requests\Api\V1\Billing\UpdateSubscriptionStatusRequest;
use App\Http\Resources\Api\V1\Billing\StudentSubscriptionResource;
use App\Http\Resources\Api\V1\Billing\StudyPackageResource;
use App\Models\StudentSubscription;
use App\Models\StudyPackage;
use App\Modules\Billing\Actions\CreateStudentSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StudentSubscription::query()
            ->with([
                'student',
                'enrollment.cohort',
                'studyPackage',
                'installments.invoice.payments',
                'creator:id,name',
            ])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->whereHas('student', function ($query) use ($search): void {
                    $query
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest('starts_on');
        $subscriptions = $query->get();
        $packages = StudyPackage::query()
            ->with(['program', 'level'])
            ->withCount('subscriptions')
            ->orderBy('program_id')
            ->orderBy('price')
            ->get();
        $outstanding = $subscriptions->sum(
            fn (StudentSubscription $subscription) => $subscription->installments->sum(
                fn ($installment) => (float) ($installment->invoice?->balance ?? 0),
            ),
        );

        return response()->json([
            'data' => [
                'summary' => [
                    'total' => $subscriptions->count(),
                    'active' => $subscriptions->whereIn('status', [
                        SubscriptionStatus::Active,
                        SubscriptionStatus::Expiring,
                    ])->count(),
                    'frozen' => $subscriptions->where('status', SubscriptionStatus::Frozen)->count(),
                    'renewal_due' => $subscriptions
                        ->whereIn('status', [SubscriptionStatus::Active, SubscriptionStatus::Expiring])
                        ->filter(fn (StudentSubscription $subscription) => $subscription->renewal_due_on->lte(today()->addDays(14)))
                        ->count(),
                    'outstanding' => number_format((float) $outstanding, 2, '.', ''),
                ],
                'packages' => StudyPackageResource::collection($packages)->resolve($request),
                'subscriptions' => StudentSubscriptionResource::collection($subscriptions)->resolve($request),
            ],
        ]);
    }

    public function store(
        StoreSubscriptionRequest $request,
        CreateStudentSubscription $createSubscription,
    ): StudentSubscriptionResource {
        return new StudentSubscriptionResource(
            $createSubscription->execute($request->validated(), $request->user()),
        );
    }

    public function updateStatus(
        UpdateSubscriptionStatusRequest $request,
        StudentSubscription $studentSubscription,
    ): StudentSubscriptionResource {
        $data = $request->validated();
        $target = SubscriptionStatus::from($data['status']);

        if ($target === SubscriptionStatus::Frozen) {
            if (! in_array($studentSubscription->status, [SubscriptionStatus::Active, SubscriptionStatus::Expiring], true)) {
                throw ValidationException::withMessages([
                    'status' => ['يمكن تجميد الاشتراك النشط فقط.'],
                ]);
            }

            $studentSubscription->update([
                'status' => $target,
                'frozen_at' => now(),
                'frozen_until' => $data['frozen_until'],
                'notes' => $data['notes'] ?? $studentSubscription->notes,
            ]);
        } elseif ($target === SubscriptionStatus::Active) {
            if ($studentSubscription->status !== SubscriptionStatus::Frozen) {
                throw ValidationException::withMessages([
                    'status' => ['يمكن إعادة تفعيل الاشتراك المجمّد فقط.'],
                ]);
            }

            $frozenDays = max(1, $studentSubscription->frozen_at?->diffInDays(now()) ?? 1);
            $studentSubscription->update([
                'status' => SubscriptionStatus::Active,
                'ends_on' => $studentSubscription->ends_on->copy()->addDays($frozenDays),
                'renewal_due_on' => $studentSubscription->renewal_due_on->copy()->addDays($frozenDays),
                'frozen_at' => null,
                'frozen_until' => null,
                'notes' => $data['notes'] ?? $studentSubscription->notes,
            ]);
        } elseif ($target === SubscriptionStatus::Cancelled) {
            $studentSubscription->update([
                'status' => $target,
                'cancelled_at' => now(),
                'notes' => $data['notes'] ?? $studentSubscription->notes,
            ]);
        } else {
            $studentSubscription->update([
                'status' => $target,
                'notes' => $data['notes'] ?? $studentSubscription->notes,
            ]);
        }

        return new StudentSubscriptionResource($this->loadSubscription($studentSubscription));
    }

    public function renew(
        RenewSubscriptionRequest $request,
        StudentSubscription $studentSubscription,
        CreateStudentSubscription $createSubscription,
    ): StudentSubscriptionResource {
        if (! in_array($studentSubscription->status, [
            SubscriptionStatus::Active,
            SubscriptionStatus::Expiring,
            SubscriptionStatus::Completed,
        ], true)) {
            throw ValidationException::withMessages([
                'subscription' => ['حالة الاشتراك الحالية لا تسمح بالتجديد.'],
            ]);
        }

        return new StudentSubscriptionResource(
            $createSubscription->execute($request->validated(), $request->user(), $studentSubscription),
        );
    }

    private function loadSubscription(StudentSubscription $subscription): StudentSubscription
    {
        return $subscription->fresh()->load([
            'student',
            'enrollment.cohort',
            'studyPackage',
            'installments.invoice.payments',
            'creator:id,name',
        ]);
    }
}
