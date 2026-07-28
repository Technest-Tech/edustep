<?php

namespace Tests\Feature\Api\V1\People;

use App\Models\AuditLog;
use App\Models\ClassSession;
use App\Models\Cohort;
use App\Models\Level;
use App\Models\Program;
use App\Models\TeacherProfile;
use App\Models\TeacherRateRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TeacherManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_management_can_create_a_complete_teacher_profile_and_account(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $response = $this->actingAs($owner)
            ->postJson('/api/v1/teachers', [
                'name' => 'هبة مصطفى',
                'email' => 'heba.teacher@example.test',
                'phone' => '01012345678',
                'status' => 'active',
                'employment_type' => 'part_time',
                'specialization' => 'محادثة ومناهج الأطفال',
                'availability' => ['saturday', 'monday', 'wednesday'],
                'bio' => 'خبرة خمس سنوات في تدريس اللغة الإنجليزية.',
                'rate_type' => 'fixed_session',
                'rate_amount' => 350,
                'password' => 'TeacherPass123',
                'password_confirmation' => 'TeacherPass123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'هبة مصطفى')
            ->assertJsonPath('data.current_rate.type', 'fixed_session')
            ->assertJsonPath('data.current_rate.amount', '350.00')
            ->assertJsonPath('data.active_cohorts_count', 0);

        $teacher = User::query()->findOrFail($response->json('data.id'));
        $this->assertSame('teacher', $teacher->role);
        $this->assertFalse($teacher->must_change_password);
        $this->assertTrue(Hash::check('TeacherPass123', $teacher->password));
        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $teacher->id,
            'employment_type' => 'part_time',
            'specialization' => 'محادثة ومناهج الأطفال',
        ]);
        $this->assertDatabaseHas('teacher_rate_rules', [
            'teacher_id' => $teacher->id,
            'rate_type' => 'fixed_session',
            'amount' => 350,
            'is_active' => true,
        ]);

        $audit = AuditLog::query()->where('action', 'teacher.created')->firstOrFail();
        $this->assertArrayNotHasKey('password', $audit->new_values);
        $this->assertContains('password', $audit->changed_fields);
    }

    public function test_management_can_update_profile_rate_and_login_without_exposing_password(): void
    {
        $manager = User::factory()->create(['role' => 'academic_manager']);
        $teacher = $this->createTeacher('teacher-one@example.test');

        $this->actingAs($manager)
            ->patchJson("/api/v1/teachers/{$teacher->id}", [
                'name' => 'سارة محمد',
                'phone' => '01099998888',
                'employment_type' => 'full_time',
                'specialization' => 'IELTS and Adults',
                'availability' => ['sunday', 'tuesday', 'thursday'],
                'bio' => 'Senior teacher',
                'rate_type' => 'hourly',
                'rate_amount' => 420,
                'password' => 'UpdatedPass123',
                'password_confirmation' => 'UpdatedPass123',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'سارة محمد')
            ->assertJsonPath('data.current_rate.type', 'hourly')
            ->assertJsonPath('data.current_rate.amount', '420.00');

        $teacher->refresh();
        $this->assertSame('سارة محمد', $teacher->name);
        $this->assertFalse($teacher->must_change_password);
        $this->assertTrue(Hash::check('UpdatedPass123', $teacher->password));
        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $teacher->id,
            'employment_type' => 'full_time',
            'hourly_rate' => 420,
        ]);

        $audit = AuditLog::query()->where('action', 'teacher.updated')->firstOrFail();
        $this->assertArrayNotHasKey('password', $audit->new_values);
        $this->assertContains('password', $audit->changed_fields);
    }

    public function test_management_can_reassign_groups_and_future_sessions_without_changing_history(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $firstTeacher = $this->createTeacher('first@example.test');
        $secondTeacher = $this->createTeacher('second@example.test');
        [$program, $level] = $this->catalog();
        $transferred = $this->createCohort($program, $level, $firstTeacher, 'A-01');
        $removed = $this->createCohort($program, $level, $secondTeacher, 'A-02');

        $futureTransferred = $this->createSession(
            $transferred,
            $firstTeacher,
            now()->addDays(2)->setTime(18, 0),
        );
        $historicalTransferred = $this->createSession(
            $transferred,
            $firstTeacher,
            now()->subDays(2)->setTime(18, 0),
            'completed',
        );
        $futureRemoved = $this->createSession(
            $removed,
            $secondTeacher,
            now()->addDays(3)->setTime(19, 0),
        );

        $this->actingAs($owner)
            ->putJson("/api/v1/teachers/{$secondTeacher->id}/cohorts", [
                'cohort_ids' => [$transferred->id],
                'update_future_sessions' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.active_cohorts_count', 1)
            ->assertJsonPath('data.cohorts.0.id', $transferred->id);

        $this->assertSame($secondTeacher->id, $transferred->fresh()->teacher_id);
        $this->assertNull($removed->fresh()->teacher_id);
        $this->assertSame($secondTeacher->id, $futureTransferred->fresh()->teacher_id);
        $this->assertSame($firstTeacher->id, $historicalTransferred->fresh()->teacher_id);
        $this->assertNull($futureRemoved->fresh()->teacher_id);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'teacher.cohorts_synced',
            'auditable_id' => $secondTeacher->id,
        ]);
    }

    public function test_active_groups_must_be_reassigned_before_suspending_a_teacher(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = $this->createTeacher('busy@example.test');
        [$program, $level] = $this->catalog();
        $this->createCohort($program, $level, $teacher, 'B-01');

        $this->actingAs($owner)
            ->patchJson("/api/v1/teachers/{$teacher->id}", [
                'status' => 'suspended',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertSame('active', $teacher->fresh()->status);
    }

    public function test_regular_staff_cannot_manage_teacher_profiles(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $teacher = $this->createTeacher('protected@example.test');

        $this->actingAs($staff)
            ->getJson('/api/v1/teachers')
            ->assertForbidden();
        $this->actingAs($staff)
            ->patchJson("/api/v1/teachers/{$teacher->id}", ['name' => 'غير مسموح'])
            ->assertForbidden();
    }

    private function createTeacher(string $email): User
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'status' => 'active',
            'email' => $email,
        ]);
        TeacherProfile::query()->create([
            'user_id' => $teacher->id,
            'phone' => '01000000000',
            'employment_type' => 'part_time',
            'specialization' => 'General English',
            'hourly_rate' => 250,
            'availability' => ['saturday', 'monday'],
        ]);
        TeacherRateRule::query()->create([
            'teacher_id' => $teacher->id,
            'rate_type' => 'hourly',
            'amount' => 250,
            'effective_from' => today(),
            'is_active' => true,
        ]);

        return $teacher;
    }

    /**
     * @return array{Program, Level}
     */
    private function catalog(): array
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

        return [$program, $level];
    }

    private function createCohort(
        Program $program,
        Level $level,
        User $teacher,
        string $code,
    ): Cohort {
        return Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'teacher_id' => $teacher->id,
            'code' => $code,
            'name' => "Group {$code}",
            'status' => 'active',
            'delivery_mode' => 'online',
            'capacity' => 12,
            'fee' => 2500,
            'timezone' => 'Africa/Cairo',
        ]);
    }

    private function createSession(
        Cohort $cohort,
        User $teacher,
        $startsAt,
        string $status = 'scheduled',
    ): ClassSession {
        return ClassSession::query()->create([
            'cohort_id' => $cohort->id,
            'teacher_id' => $teacher->id,
            'title' => 'English Session',
            'status' => $status,
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(90),
            'completed_at' => $status === 'completed' ? $startsAt->copy()->addMinutes(90) : null,
        ]);
    }
}
