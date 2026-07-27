<?php

namespace Tests\Feature\Api\V1\Operations;

use App\Enums\CohortStatus;
use App\Enums\TeacherRateType;
use App\Models\Cohort;
use App\Models\Level;
use App\Models\Program;
use App\Models\TeacherRateRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarAndPayrollTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_lists_sessions_and_prevents_teacher_conflicts(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $cohort = $this->createCohort($teacher);
        $startsAt = now()->addDay()->setTime(17, 0);

        $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/sessions", [
                'title' => 'الحصة الأولى',
                'starts_at' => $startsAt->toIso8601String(),
                'ends_at' => $startsAt->copy()->addMinutes(90)->toIso8601String(),
            ])
            ->assertCreated();

        $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/sessions", [
                'title' => 'حصة متعارضة',
                'starts_at' => $startsAt->copy()->addMinutes(30)->toIso8601String(),
                'ends_at' => $startsAt->copy()->addMinutes(120)->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at');

        $this->actingAs($owner)
            ->getJson('/api/v1/calendar?from='.$startsAt->toDateString().'&to='.$startsAt->toDateString())
            ->assertOk()
            ->assertJsonPath('data.summary.total', 1)
            ->assertJsonPath('data.sessions.0.cohort.id', $cohort->id);
    }

    public function test_completed_session_generates_one_traceable_teacher_earning(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $cohort = $this->createCohort($teacher);
        TeacherRateRule::query()->create([
            'teacher_id' => $teacher->id,
            'rate_type' => TeacherRateType::Hourly,
            'amount' => 200,
            'effective_from' => today()->subMonth(),
        ]);
        $startsAt = now()->subHours(2);

        $sessionId = $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/sessions", [
                'title' => 'حصة مكتملة',
                'starts_at' => $startsAt->toIso8601String(),
                'ends_at' => $startsAt->copy()->addMinutes(90)->toIso8601String(),
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($owner)
            ->patchJson("/api/v1/class-sessions/{$sessionId}", ['status' => 'completed'])
            ->assertOk();
        $this->actingAs($owner)
            ->patchJson("/api/v1/class-sessions/{$sessionId}", ['status' => 'completed'])
            ->assertOk();

        $this->assertDatabaseCount('teacher_earnings', 1);
        $this->assertDatabaseHas('teacher_earnings', [
            'class_session_id' => $sessionId,
            'teacher_id' => $teacher->id,
            'amount' => 300,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->getJson('/api/v1/finance/payroll')
            ->assertOk()
            ->assertJsonPath('data.summary.sessions', 1)
            ->assertJsonPath('data.summary.pending', '300.00');
    }

    public function test_expense_requires_approval_before_payment(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $accountant = User::factory()->create(['role' => 'accountant']);

        $expenseId = $this->actingAs($accountant)
            ->postJson('/api/v1/finance/expenses', [
                'category' => 'تسويق',
                'vendor_name' => 'Meta',
                'description' => 'حملة إعلانية',
                'amount' => 1200,
                'incurred_on' => today()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'submitted')
            ->json('data.id');

        $this->actingAs($accountant)
            ->patchJson("/api/v1/finance/expenses/{$expenseId}/status", [
                'status' => 'paid',
                'payment_method' => 'bank_transfer',
            ])
            ->assertUnprocessable();

        $this->actingAs($owner)
            ->patchJson("/api/v1/finance/expenses/{$expenseId}/status", [
                'status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->actingAs($accountant)
            ->patchJson("/api/v1/finance/expenses/{$expenseId}/status", [
                'status' => 'paid',
                'payment_method' => 'bank_transfer',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
    }

    private function createCohort(User $teacher): Cohort
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
            'teacher_id' => $teacher->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 2400,
        ]);
    }
}
