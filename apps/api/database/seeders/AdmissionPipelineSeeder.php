<?php

namespace Database\Seeders;

use App\Enums\EnrollmentOfferStatus;
use App\Enums\SeatReservationStatus;
use App\Enums\TrialBookingStatus;
use App\Enums\WaitlistStatus;
use App\Models\Cohort;
use App\Models\EnrollmentOffer;
use App\Models\Lead;
use App\Models\SeatReservation;
use App\Models\TrialBooking;
use App\Models\User;
use App\Models\WaitlistEntry;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdmissionPipelineSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();
        $admissions = User::query()->where('email', 'admissions@edustep.local')->firstOrFail();
        $kidsCohort = Cohort::query()->where('code', 'K-14')->firstOrFail();
        $teenCohort = Cohort::query()->where('code', 'T-08')->firstOrFail();
        $newCohort = Cohort::query()->where('code', 'A-21')->firstOrFail();

        $youssefLead = Lead::query()->where('full_name', 'يوسف شريف')->firstOrFail();
        $youssefOffer = EnrollmentOffer::query()->updateOrCreate(
            ['offer_number' => 'OFF-2026-DEMO01'],
            [
                'lead_id' => $youssefLead->id,
                'cohort_id' => $teenCohort->id,
                'created_by' => $admissions->id,
                'approved_by' => $owner->id,
                'status' => EnrollmentOfferStatus::Sent,
                'price_amount' => 2200,
                'discount_amount' => 100,
                'net_amount' => 2100,
                'valid_until' => today()->addDays(5),
                'notes' => 'عرض مناسب بعد اجتياز تقييم المستوى.',
                'sent_at' => now()->subHours(3),
            ],
        );
        SeatReservation::query()->updateOrCreate(
            [
                'lead_id' => $youssefLead->id,
                'cohort_id' => $teenCohort->id,
            ],
            [
                'enrollment_offer_id' => $youssefOffer->id,
                'reserved_by' => $admissions->id,
                'status' => SeatReservationStatus::Held,
                'reserved_until' => now()->addHours(45),
                'converted_at' => null,
                'released_at' => null,
                'release_reason' => null,
            ],
        );

        $norhanLead = Lead::query()->where('full_name', 'نورهان علي')->firstOrFail();
        EnrollmentOffer::query()->updateOrCreate(
            ['offer_number' => 'OFF-2026-DEMO02'],
            [
                'lead_id' => $norhanLead->id,
                'cohort_id' => $newCohort->id,
                'created_by' => $admissions->id,
                'approved_by' => null,
                'status' => EnrollmentOfferStatus::Draft,
                'price_amount' => 2400,
                'discount_amount' => 0,
                'net_amount' => 2400,
                'valid_until' => today()->addWeek(),
                'notes' => 'مسودة بانتظار تأكيد جدول العمل.',
                'sent_at' => null,
            ],
        );

        $adamLead = Lead::query()->where('full_name', 'والدة آدم')->firstOrFail();
        TrialBooking::query()->updateOrCreate(
            [
                'lead_id' => $adamLead->id,
                'cohort_id' => $kidsCohort->id,
            ],
            [
                'created_by' => $admissions->id,
                'status' => TrialBookingStatus::Confirmed,
                'scheduled_at' => now()->addDays(2)->setTime(16, 0),
                'duration_minutes' => 60,
                'meeting_url' => $kidsCohort->meeting_url,
                'room_name' => null,
                'notes' => 'تجربة داخل الجروب الحالي مع متابعة التفاعل.',
                'confirmed_at' => now()->subHour(),
            ],
        );

        $layanLead = Lead::query()->where('full_name', 'والدة ليان')->firstOrFail();
        WaitlistEntry::query()->updateOrCreate(
            [
                'lead_id' => $layanLead->id,
                'cohort_id' => $kidsCohort->id,
            ],
            [
                'created_by' => $admissions->id,
                'status' => WaitlistStatus::Waiting,
                'priority' => 10,
                'joined_at' => now()->subDay(),
                'offered_until' => null,
                'notes' => 'تفضل موعد الأحد والأربعاء فقط.',
            ],
        );
    }
}
