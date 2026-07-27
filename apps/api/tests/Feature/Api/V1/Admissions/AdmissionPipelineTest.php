<?php

namespace Tests\Feature\Api\V1\Admissions;

use App\Enums\CohortStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\StudentStatus;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Level;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmissionPipelineTest extends TestCase
{
    use RefreshDatabase;

    public function test_offer_can_hold_a_seat_and_acceptance_converts_the_lead_once(): void
    {
        [$owner, $cohort] = $this->admissionContext();
        $lead = $this->createLead($owner, 'يوسف شريف');

        $offerResponse = $this->actingAs($owner)
            ->postJson("/api/v1/leads/{$lead->id}/offers", [
                'cohort_id' => $cohort->id,
                'price_amount' => 2400,
                'discount_amount' => 200,
                'valid_until' => today()->addWeek()->toDateString(),
                'hold_seat' => true,
                'hold_hours' => 48,
                'send_now' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.net_amount', '2200.00')
            ->assertJsonPath('data.seat_reservation.status', 'held');

        $offerId = $offerResponse->json('data.id');

        $this->actingAs($owner)
            ->postJson("/api/v1/offers/{$offerId}/accept", [
                'guardian_name' => 'شريف محمد',
                'guardian_phone' => '01099998888',
            ])
            ->assertCreated()
            ->assertJsonPath('data.full_name', 'يوسف شريف')
            ->assertJsonPath('data.enrollments.0.cohort.id', $cohort->id);

        $this->assertDatabaseHas('enrollment_offers', [
            'id' => $offerId,
            'status' => 'accepted',
        ]);
        $this->assertDatabaseHas('seat_reservations', [
            'lead_id' => $lead->id,
            'cohort_id' => $cohort->id,
            'status' => 'converted',
        ]);
        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'status' => 'won',
        ]);

        $this->actingAs($owner)
            ->postJson("/api/v1/offers/{$offerId}/accept")
            ->assertUnprocessable();
    }

    public function test_full_cohort_creates_waitlist_then_promotes_when_a_seat_opens(): void
    {
        [$owner, $cohort] = $this->admissionContext(capacity: 1);
        $student = Student::query()->create([
            'student_code' => 'ES-2026-001',
            'full_name' => 'طالب حالي',
            'phone' => '01010000000',
            'status' => StudentStatus::Active,
            'joined_on' => today(),
        ]);
        $enrollment = Enrollment::query()->create([
            'student_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => EnrollmentStatus::Active,
            'enrolled_on' => today(),
            'fee_amount' => 2400,
            'discount_amount' => 0,
            'net_amount' => 2400,
        ]);
        $lead = $this->createLead($owner, 'عميل انتظار');

        $waitlistResponse = $this->actingAs($owner)
            ->postJson("/api/v1/leads/{$lead->id}/seat", [
                'cohort_id' => $cohort->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.mode', 'waitlist')
            ->assertJsonPath('data.item.status', 'waiting');

        $enrollment->update(['status' => EnrollmentStatus::Cancelled]);
        $waitlistId = $waitlistResponse->json('data.item.id');

        $this->actingAs($owner)
            ->postJson("/api/v1/waitlist/{$waitlistId}/promote")
            ->assertOk()
            ->assertJsonPath('data.mode', 'reservation')
            ->assertJsonPath('data.item.status', 'held');

        $this->assertDatabaseHas('waitlist_entries', [
            'id' => $waitlistId,
            'status' => 'offered',
        ]);
    }

    public function test_trial_can_be_scheduled_confirmed_and_marked_attended(): void
    {
        [$owner, $cohort] = $this->admissionContext();
        $lead = $this->createLead($owner, 'والدة آدم');

        $trialResponse = $this->actingAs($owner)
            ->postJson("/api/v1/leads/{$lead->id}/trials", [
                'cohort_id' => $cohort->id,
                'scheduled_at' => now()->addDays(2)->setTime(18, 0)->toIso8601String(),
                'duration_minutes' => 60,
                'notes' => 'التركيز على التفاعل والمحادثة.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'scheduled');

        $trialId = $trialResponse->json('data.id');
        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'status' => LeadStatus::TrialScheduled->value,
        ]);

        $this->actingAs($owner)
            ->patchJson("/api/v1/trials/{$trialId}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAs($owner)
            ->patchJson("/api/v1/trials/{$trialId}", ['status' => 'attended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'attended');

        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'status' => LeadStatus::Qualified->value,
        ]);
    }

    /**
     * @return array{User, Cohort}
     */
    private function admissionContext(int $capacity = 12): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $program = Program::query()->create([
            'code' => 'GENERAL',
            'name_ar' => 'الإنجليزية العامة',
        ]);
        $level = Level::query()->create([
            'program_id' => $program->id,
            'code' => 'A1',
            'name_ar' => 'المستوى A1',
        ]);
        $cohort = Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Enrolling,
            'capacity' => $capacity,
            'fee' => 2400,
        ]);

        return [$owner, $cohort];
    }

    private function createLead(User $owner, string $name): Lead
    {
        return Lead::query()->create([
            'owner_id' => $owner->id,
            'full_name' => $name,
            'phone' => '01055556666',
            'source' => LeadSource::WhatsApp,
            'status' => LeadStatus::Qualified,
        ]);
    }
}
