<?php

namespace Tests\Feature\Api\V1\Billing;

use App\Enums\CohortStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\StudentStatus;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudyPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscription_creates_balanced_installments_and_traceable_invoices(): void
    {
        [$owner, $student, $enrollment, $package] = $this->subscriptionContext();

        $response = $this->actingAs($owner)
            ->postJson('/api/v1/billing/subscriptions', [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'study_package_id' => $package->id,
                'starts_on' => today()->toDateString(),
                'installment_count' => 3,
                'discount_amount' => 100,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.net_amount', '900.00')
            ->assertJsonCount(3, 'data.installments');

        $amounts = collect($response->json('data.installments'))->pluck('amount')->map(fn ($amount) => (float) $amount);

        $this->assertSame(900.0, $amounts->sum());
        $this->assertDatabaseCount('invoices', 3);
        $this->assertDatabaseCount('subscription_installments', 3);
    }

    public function test_subscription_can_be_frozen_reactivated_and_renewed_once(): void
    {
        [$owner, $student, $enrollment, $package] = $this->subscriptionContext();
        $subscriptionId = $this->actingAs($owner)
            ->postJson('/api/v1/billing/subscriptions', [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'study_package_id' => $package->id,
                'starts_on' => today()->toDateString(),
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($owner)
            ->patchJson("/api/v1/billing/subscriptions/{$subscriptionId}/status", [
                'status' => 'frozen',
                'frozen_until' => today()->addWeek()->toDateString(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'frozen');

        $this->actingAs($owner)
            ->patchJson("/api/v1/billing/subscriptions/{$subscriptionId}/status", [
                'status' => 'active',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $renewal = $this->actingAs($owner)
            ->postJson("/api/v1/billing/subscriptions/{$subscriptionId}/renew", [
                'installment_count' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.parent_subscription_id', $subscriptionId);

        $this->assertDatabaseHas('student_subscriptions', [
            'id' => $subscriptionId,
            'status' => 'renewed',
        ]);

        $this->actingAs($owner)
            ->postJson("/api/v1/billing/subscriptions/{$subscriptionId}/renew")
            ->assertUnprocessable();
        $this->assertNotSame($subscriptionId, $renewal->json('data.id'));
    }

    public function test_full_invoice_payment_marks_the_linked_installment_paid(): void
    {
        [$owner, $student, $enrollment, $package] = $this->subscriptionContext();
        $response = $this->actingAs($owner)
            ->postJson('/api/v1/billing/subscriptions', [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'study_package_id' => $package->id,
                'starts_on' => today()->toDateString(),
                'installment_count' => 1,
            ])
            ->assertCreated();
        $invoiceId = $response->json('data.installments.0.invoice.id');

        $this->actingAs($owner)
            ->postJson("/api/v1/finance/invoices/{$invoiceId}/payments", [
                'amount' => 1000,
                'method' => 'instapay',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('subscription_installments', [
            'invoice_id' => $invoiceId,
            'status' => 'paid',
        ]);
    }

    /**
     * @return array{User, Student, Enrollment, StudyPackage}
     */
    private function subscriptionContext(): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher']);
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
            'teacher_id' => $teacher->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 1000,
        ]);
        $student = Student::query()->create([
            'student_code' => 'ES-2026-001',
            'full_name' => 'يوسف شريف',
            'phone' => '01000000000',
            'status' => StudentStatus::Active,
            'joined_on' => today(),
        ]);
        $enrollment = Enrollment::query()->create([
            'student_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => EnrollmentStatus::Active,
            'enrolled_on' => today(),
            'fee_amount' => 1000,
            'discount_amount' => 0,
            'net_amount' => 1000,
        ]);
        $package = StudyPackage::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'code' => 'GENERAL-A1',
            'name' => 'باقة A1',
            'sessions_count' => 16,
            'duration_weeks' => 8,
            'price' => 1000,
            'default_installments' => 1,
        ]);

        return [$owner, $student, $enrollment, $package];
    }
}
