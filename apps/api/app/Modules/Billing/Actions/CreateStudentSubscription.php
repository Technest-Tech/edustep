<?php

namespace App\Modules\Billing\Actions;

use App\Enums\InstallmentStatus;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Student;
use App\Models\StudentSubscription;
use App\Models\StudyPackage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateStudentSubscription
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(
        array $attributes,
        User $actor,
        ?StudentSubscription $parentSubscription = null,
    ): StudentSubscription {
        return DB::transaction(function () use ($attributes, $actor, $parentSubscription): StudentSubscription {
            $parent = $parentSubscription
                ? StudentSubscription::query()->lockForUpdate()->findOrFail($parentSubscription->id)
                : null;
            $studentId = $parent?->student_id ?? $attributes['student_id'];
            $enrollmentId = $parent?->enrollment_id ?? $attributes['enrollment_id'];
            $student = Student::query()->findOrFail($studentId);
            $enrollment = Enrollment::query()->with('cohort')->findOrFail($enrollmentId);
            $package = StudyPackage::query()
                ->with('level')
                ->where('is_active', true)
                ->findOrFail($attributes['study_package_id'] ?? $parent?->study_package_id);

            if ($enrollment->student_id !== $student->id) {
                throw ValidationException::withMessages([
                    'enrollment_id' => ['التسجيل المحدد لا يخص هذا الطالب.'],
                ]);
            }

            if ($package->program_id !== $enrollment->cohort->program_id) {
                throw ValidationException::withMessages([
                    'study_package_id' => ['الباقة لا تتوافق مع برنامج الجروب الحالي.'],
                ]);
            }

            if ($parent) {
                if ($parent->renewals()->where('status', '!=', SubscriptionStatus::Cancelled)->exists()) {
                    throw ValidationException::withMessages([
                        'subscription' => ['تم تجديد هذا الاشتراك بالفعل.'],
                    ]);
                }
            } else {
                $hasOpenSubscription = StudentSubscription::query()
                    ->where('student_id', $student->id)
                    ->whereIn('status', [
                        SubscriptionStatus::Scheduled,
                        SubscriptionStatus::Active,
                        SubscriptionStatus::Frozen,
                        SubscriptionStatus::Expiring,
                    ])
                    ->exists();

                if ($hasOpenSubscription) {
                    throw ValidationException::withMessages([
                        'student_id' => ['لدى الطالب اشتراك مفتوح بالفعل. استخدم التجديد بدلًا من إنشاء اشتراك جديد.'],
                    ]);
                }
            }

            $startsOn = Carbon::parse(
                $attributes['starts_on'] ?? $parent?->ends_on->copy()->addDay() ?? today(),
            )->startOfDay();
            $endsOn = $startsOn->copy()->addWeeks($package->duration_weeks)->subDay();
            $priceAmount = (float) $package->price;
            $paymentPlan = $attributes['payment_plan'] ?? 'custom';
            $discountAmount = $paymentPlan === 'full'
                ? round($priceAmount * ((float) $package->full_payment_discount_percent / 100), 2)
                : (float) ($attributes['discount_amount'] ?? 0);

            if ($discountAmount > $priceAmount) {
                throw ValidationException::withMessages([
                    'discount_amount' => ['قيمة الخصم لا يمكن أن تتجاوز سعر الباقة.'],
                ]);
            }

            $netAmount = round($priceAmount - $discountAmount, 2);
            $installmentCount = match ($paymentPlan) {
                'full' => 1,
                'installments' => (int) $package->default_installments,
                default => (int) ($attributes['installment_count'] ?? $package->default_installments),
            };
            $status = $startsOn->isFuture()
                ? SubscriptionStatus::Scheduled
                : ($endsOn->lte(today()->addDays(14)) ? SubscriptionStatus::Expiring : SubscriptionStatus::Active);

            $subscription = StudentSubscription::query()->create([
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'study_package_id' => $package->id,
                'parent_subscription_id' => $parent?->id,
                'created_by' => $actor->id,
                'status' => $status,
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'renewal_due_on' => $endsOn->copy()->subDays(7),
                'included_sessions' => $package->sessions_count,
                'price_amount' => $priceAmount,
                'discount_amount' => $discountAmount,
                'net_amount' => $netAmount,
                'notes' => $attributes['notes'] ?? null,
            ]);

            foreach ($this->splitAmount($netAmount, $installmentCount) as $index => $amount) {
                $dueOn = $this->installmentDueOn(
                    $package,
                    $startsOn,
                    $index,
                    $installmentCount,
                );
                $isPaid = $amount === 0.0;
                $invoice = Invoice::query()->create([
                    'student_id' => $student->id,
                    'enrollment_id' => $enrollment->id,
                    'invoice_number' => 'INV-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                    'status' => $isPaid
                        ? InvoiceStatus::Paid
                        : ($dueOn->isPast() ? InvoiceStatus::Overdue : InvoiceStatus::Issued),
                    'issued_on' => today(),
                    'due_on' => $dueOn,
                    'subtotal' => $amount,
                    'discount_amount' => 0,
                    'total_amount' => $amount,
                    'notes' => 'القسط '.($index + 1)." من اشتراك {$package->name}",
                ]);

                $subscription->installments()->create([
                    'invoice_id' => $invoice->id,
                    'installment_number' => $index + 1,
                    'amount' => $amount,
                    'due_on' => $dueOn,
                    'status' => $isPaid
                        ? InstallmentStatus::Paid
                        : ($dueOn->isPast() ? InstallmentStatus::Overdue : InstallmentStatus::Invoiced),
                    'paid_at' => $isPaid ? now() : null,
                ]);
            }

            if ($parent) {
                $parent->update(['status' => SubscriptionStatus::Renewed]);
            }

            return $subscription->load([
                'student',
                'enrollment.cohort',
                'studyPackage',
                'installments.invoice.payments',
                'creator',
            ]);
        });
    }

    /**
     * @return array<int, float>
     */
    private function splitAmount(float $amount, int $parts): array
    {
        $totalCents = (int) round($amount * 100);
        $baseCents = intdiv($totalCents, $parts);
        $remainder = $totalCents % $parts;

        return collect(range(0, $parts - 1))
            ->map(fn (int $index) => ($baseCents + ($index < $remainder ? 1 : 0)) / 100)
            ->all();
    }

    private function installmentDueOn(
        StudyPackage $package,
        Carbon $startsOn,
        int $index,
        int $installmentCount,
    ): Carbon {
        if ($index === 0) {
            return today();
        }

        if (
            $installmentCount === 2
            && $index === 1
            && $package->second_installment_session
        ) {
            $sessionsPerWeek = max(1, (int) ($package->level?->sessions_per_week ?? 2));
            $weeksBeforeSession = intdiv(
                max(0, (int) $package->second_installment_session - 1),
                $sessionsPerWeek,
            );

            return $startsOn
                ->copy()
                ->addWeeks($weeksBeforeSession)
                ->subDays((int) ($package->second_installment_due_days_before ?? 0));
        }

        return $startsOn->copy()->addMonthsNoOverflow($index);
    }
}
