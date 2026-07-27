<?php

namespace Tests\Feature\Api\V1\Academics;

use App\Enums\CohortStatus;
use App\Models\AcademyClosure;
use App\Models\Cohort;
use App\Models\Level;
use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecurringScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_generation_skips_closures_and_existing_sessions(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $program = Program::query()->create([
            'code' => 'KIDS',
            'name_ar' => 'الإنجليزية للأطفال',
        ]);
        $level = Level::query()->create([
            'program_id' => $program->id,
            'code' => 'A2',
            'name_ar' => 'المستوى A2',
        ]);
        $cohort = Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'teacher_id' => $teacher->id,
            'code' => 'K-01',
            'name' => 'Kids A2',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 1800,
            'timezone' => 'Africa/Cairo',
            'schedule' => [
                ['day' => 'sunday', 'time' => '16:00'],
                ['day' => 'wednesday', 'time' => '16:00'],
            ],
        ]);
        $from = today()->next('Sunday');
        $to = $from->copy()->addWeek();
        AcademyClosure::query()->create([
            'name' => 'إجازة',
            'starts_on' => $from,
            'ends_on' => $from,
            'affects_online' => true,
            'created_by' => $owner->id,
        ]);

        $payload = [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'duration_minutes' => 90,
            'title_prefix' => 'الحصة',
        ];

        $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/generate-sessions", $payload)
            ->assertCreated()
            ->assertJsonPath('data.summary.created', 2)
            ->assertJsonPath('data.summary.skipped_closures', 1)
            ->assertJsonPath('data.summary.skipped_duplicates', 0);

        $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/generate-sessions", $payload)
            ->assertCreated()
            ->assertJsonPath('data.summary.created', 0)
            ->assertJsonPath('data.summary.skipped_closures', 1)
            ->assertJsonPath('data.summary.skipped_duplicates', 2);

        $this->assertDatabaseCount('class_sessions', 2);
    }
}
