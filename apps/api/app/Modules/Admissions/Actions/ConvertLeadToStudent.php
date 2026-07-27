<?php

namespace App\Modules\Admissions\Actions;

use App\Enums\EnrollmentStatus;
use App\Enums\FollowUpStatus;
use App\Enums\InvoiceStatus;
use App\Enums\LeadStatus;
use App\Enums\SeatReservationStatus;
use App\Enums\StudentStatus;
use App\Enums\WaitlistStatus;
use App\Models\AcademySetting;
use App\Models\Cohort;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Student;
use App\Models\User;
use App\Modules\CRM\Actions\RecordLeadActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConvertLeadToStudent
{
    public function __construct(
        private readonly RecordLeadActivity $recordLeadActivity,
        private readonly CohortSeatAvailability $seatAvailability,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Lead $lead, array $attributes, User $actor): Student
    {
        return DB::transaction(function () use ($lead, $attributes, $actor): Student {
            $lead = Lead::query()->lockForUpdate()->findOrFail($lead->id);

            if ($lead->student()->exists() || $lead->status === LeadStatus::Won) {
                throw ValidationException::withMessages([
                    'lead' => ['تم تحويل هذا العميل إلى طالب بالفعل.'],
                ]);
            }

            $cohort = Cohort::query()
                ->whereIn('status', ['enrolling', 'active'])
                ->findOrFail($attributes['cohort_id']);
            $settings = AcademySetting::query()->first();

            if ($this->seatAvailability->for($cohort, $lead->id)['available'] <= 0) {
                throw ValidationException::withMessages([
                    'cohort_id' => ['لا توجد أماكن متاحة في هذا الجروب.'],
                ]);
            }

            $student = Student::query()->create([
                'lead_id' => $lead->id,
                'student_code' => $this->nextStudentCode(
                    $settings?->student_code_prefix ?? 'ES',
                ),
                'full_name' => $attributes['full_name'] ?? $lead->full_name,
                'phone' => $attributes['phone'] ?? $lead->phone,
                'email' => $attributes['email'] ?? $lead->email,
                'date_of_birth' => $attributes['date_of_birth'] ?? null,
                'guardian_name' => $attributes['guardian_name'] ?? null,
                'guardian_phone' => $attributes['guardian_phone'] ?? null,
                'status' => StudentStatus::Active,
                'joined_on' => today(),
                'notes' => $attributes['notes'] ?? null,
            ]);

            $feeAmount = (float) ($attributes['fee_amount'] ?? $cohort->fee);
            $discountAmount = (float) ($attributes['discount_amount'] ?? 0);

            if ($discountAmount > $feeAmount) {
                throw ValidationException::withMessages([
                    'discount_amount' => ['قيمة الخصم لا يمكن أن تتجاوز الرسوم.'],
                ]);
            }

            $enrollment = $student->enrollments()->create([
                'cohort_id' => $cohort->id,
                'status' => EnrollmentStatus::Active,
                'enrolled_on' => today(),
                'fee_amount' => $feeAmount,
                'discount_amount' => $discountAmount,
                'net_amount' => $feeAmount - $discountAmount,
                'notes' => $attributes['enrollment_notes'] ?? null,
            ]);

            Invoice::query()->create([
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'invoice_number' => ($settings?->invoice_prefix ?? 'INV')
                    .'-'.now()->format('ym').'-'.Str::upper(Str::random(6)),
                'status' => InvoiceStatus::Issued,
                'issued_on' => today(),
                'due_on' => today()->addDays(7),
                'subtotal' => $feeAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $feeAmount - $discountAmount,
                'notes' => 'فاتورة التسجيل في '.$cohort->name,
            ]);

            $lead->forceFill([
                'status' => LeadStatus::Won,
                'converted_at' => now(),
            ])->save();

            $lead->followUps()
                ->where('status', FollowUpStatus::Pending)
                ->update([
                    'status' => FollowUpStatus::Completed,
                    'completed_at' => now(),
                ]);

            $lead->seatReservations()
                ->where('cohort_id', $cohort->id)
                ->where('status', SeatReservationStatus::Held)
                ->update([
                    'status' => SeatReservationStatus::Converted,
                    'converted_at' => now(),
                ]);
            $lead->waitlistEntries()
                ->where('cohort_id', $cohort->id)
                ->whereIn('status', [WaitlistStatus::Waiting, WaitlistStatus::Offered])
                ->update([
                    'status' => WaitlistStatus::Converted,
                    'offered_until' => null,
                ]);

            $this->recordLeadActivity->handle($lead, [
                'type' => 'converted',
                'channel' => 'system',
                'direction' => 'internal',
                'title' => 'تم تحويل العميل إلى طالب',
                'details' => "تم إنشاء ملف الطالب {$student->student_code} وتسجيله في {$cohort->name}.",
                'metadata' => [
                    'student_id' => $student->id,
                    'cohort_id' => $cohort->id,
                ],
            ], $actor);

            return $student->load(['enrollments.cohort.level', 'enrollments.cohort.program']);
        });
    }

    private function nextStudentCode(string $prefix): string
    {
        $sequence = Student::withTrashed()->count() + 1;

        return sprintf('%s-%s-%03d', $prefix, now()->format('Y'), $sequence);
    }
}
