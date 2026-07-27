<?php

namespace Tests\Feature\Api\V1\CRM;

use App\Enums\CohortStatus;
use App\Enums\FollowUpStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Level;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_staff_member_can_create_and_filter_leads(): void
    {
        $user = User::factory()->create();
        $program = Program::query()->create([
            'code' => 'KIDS',
            'name_ar' => 'الإنجليزية للأطفال',
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/leads', [
                'full_name' => 'أحمد سامح',
                'phone' => '01011112222',
                'source' => LeadSource::WhatsApp->value,
                'interested_program_id' => $program->id,
                'learner_age' => 10,
            ])
            ->assertCreated()
            ->assertJsonPath('data.full_name', 'أحمد سامح')
            ->assertJsonPath('data.status.value', LeadStatus::New->value)
            ->assertJsonPath('data.owner.id', $user->id);

        $this->assertDatabaseHas('lead_activities', [
            'type' => 'lead_created',
            'title' => 'تم تسجيل العميل المحتمل',
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/leads?search=010111&status=new')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '01011112222');
    }

    public function test_a_follow_up_can_be_created_and_completed(): void
    {
        $user = User::factory()->create();
        $lead = Lead::query()->create([
            'owner_id' => $user->id,
            'full_name' => 'مريم خالد',
            'phone' => '01033334444',
            'source' => LeadSource::Instagram,
            'status' => LeadStatus::Contacted,
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/leads/{$lead->id}/follow-ups", [
                'subject' => 'تأكيد اختبار المستوى',
                'priority' => 'high',
                'due_at' => now()->addDay()->toIso8601String(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', FollowUpStatus::Pending->value);

        $followUpId = $response->json('data.id');

        $this->actingAs($user)
            ->patchJson("/api/v1/follow-ups/{$followUpId}", [
                'status' => FollowUpStatus::Completed->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', FollowUpStatus::Completed->value);

        $this->assertDatabaseHas('follow_ups', [
            'id' => $followUpId,
            'status' => FollowUpStatus::Completed->value,
        ]);
    }

    public function test_a_qualified_lead_can_be_converted_to_a_student_once(): void
    {
        $user = User::factory()->create();
        $cohort = $this->createCohort();
        $lead = Lead::query()->create([
            'owner_id' => $user->id,
            'full_name' => 'يوسف شريف',
            'phone' => '01044445555',
            'source' => LeadSource::Referral,
            'status' => LeadStatus::Qualified,
        ]);
        $lead->followUps()->create([
            'assigned_to' => $user->id,
            'subject' => 'متابعة التسجيل',
            'priority' => 'medium',
            'status' => FollowUpStatus::Pending,
            'due_at' => now()->addHour(),
        ]);

        $this->actingAs($user)
            ->postJson("/api/v1/leads/{$lead->id}/convert", [
                'cohort_id' => $cohort->id,
                'discount_amount' => 200,
            ])
            ->assertCreated()
            ->assertJsonPath('data.full_name', 'يوسف شريف')
            ->assertJsonPath('data.enrollments.0.cohort.id', $cohort->id);

        $this->assertSame(1, Student::query()->count());
        $this->assertSame(1, Enrollment::query()->count());
        $this->assertSame(1, Invoice::query()->count());
        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
            'status' => LeadStatus::Won->value,
        ]);
        $this->assertDatabaseHas('follow_ups', [
            'lead_id' => $lead->id,
            'status' => FollowUpStatus::Completed->value,
        ]);

        $this->actingAs($user)
            ->postJson("/api/v1/leads/{$lead->id}/convert", [
                'cohort_id' => $cohort->id,
            ])
            ->assertUnprocessable();
    }

    public function test_the_dashboard_returns_operational_metrics(): void
    {
        $user = User::factory()->create();
        $this->createCohort();
        Lead::query()->create([
            'owner_id' => $user->id,
            'full_name' => 'عميل جديد',
            'phone' => '01000000000',
            'source' => LeadSource::Website,
            'status' => LeadStatus::New,
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.metrics.open_leads', 1)
            ->assertJsonPath('data.metrics.new_leads', 1)
            ->assertJsonStructure([
                'data' => [
                    'metrics',
                    'funnel',
                    'recent_leads',
                    'today_follow_ups',
                    'cohorts',
                    'generated_at',
                ],
            ]);
    }

    private function createCohort(): Cohort
    {
        $program = Program::query()->create([
            'code' => 'GENERAL',
            'name_ar' => 'الإنجليزية العامة',
        ]);
        $level = Level::query()->create([
            'program_id' => $program->id,
            'code' => 'A1',
            'name_ar' => 'المستوى A1',
        ]);

        return Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 2400,
        ]);
    }
}
