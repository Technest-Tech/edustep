<?php

namespace Tests\Feature\Api\V1\Portals;

use App\Models\ClassSession;
use App\Models\GuardianProfile;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePortalsTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_workspace_and_academic_data_are_scoped_to_the_teacher(): void
    {
        $this->seed(DatabaseSeeder::class);
        $teacher = User::query()->where('email', 'sara@edustep.local')->firstOrFail();
        $otherTeacher = User::query()->where('email', 'mahmoud@edustep.local')->firstOrFail();
        $otherSession = ClassSession::query()->where('teacher_id', $otherTeacher->id)->firstOrFail();

        $this->actingAs($teacher)
            ->getJson('/api/v1/teacher/today')
            ->assertOk()
            ->assertJsonPath('data.teacher.id', $teacher->id)
            ->assertJsonPath('data.summary.active_cohorts', 2)
            ->assertJsonMissing(['teacher' => ['id' => $otherTeacher->id]]);

        $this->actingAs($teacher)
            ->getJson('/api/v1/cohorts')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($teacher)
            ->putJson("/api/v1/class-sessions/{$otherSession->id}/attendance", [
                'records' => [
                    [
                        'student_id' => Student::query()
                            ->whereHas('enrollments', fn ($query) => $query->where('cohort_id', $otherSession->cohort_id))
                            ->value('id'),
                        'status' => 'present',
                    ],
                ],
            ])
            ->assertForbidden();
    }

    public function test_guardian_home_contains_only_linked_children_and_blocks_staff_dashboard(): void
    {
        $this->seed(DatabaseSeeder::class);
        $guardian = User::query()->where('email', 'parent@edustep.local')->firstOrFail();
        $linkedIds = GuardianProfile::query()
            ->where('user_id', $guardian->id)
            ->firstOrFail()
            ->students()
            ->pluck('students.id')
            ->all();

        $response = $this->actingAs($guardian)
            ->getJson('/api/v1/family/home')
            ->assertOk()
            ->assertJsonCount(2, 'data.children')
            ->assertJsonPath('data.summary.children', 2)
            ->assertJsonCount(2, 'data.messages');

        $this->assertEqualsCanonicalizing($linkedIds, collect($response->json('data.children'))->pluck('id')->all());
        $this->actingAs($guardian)->getJson('/api/v1/dashboard')->assertForbidden();
        $this->actingAs($guardian)->getJson('/api/v1/students')->assertForbidden();
    }

    public function test_external_message_is_queued_until_a_provider_is_connected(): void
    {
        $this->seed(DatabaseSeeder::class);
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();
        $guardian = GuardianProfile::query()->firstOrFail();
        $student = $guardian->students()->firstOrFail();

        $this->actingAs($owner)
            ->postJson('/api/v1/messages', [
                'guardian_id' => $guardian->id,
                'student_id' => $student->id,
                'channel' => 'whatsapp',
                'body' => 'تذكير بموعد الحصة القادمة.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.provider_connected', false);

        $this->assertDatabaseHas('messages', [
            'guardian_id' => $guardian->id,
            'student_id' => $student->id,
            'status' => 'queued',
        ]);
    }
}
