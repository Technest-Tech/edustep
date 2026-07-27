<?php

namespace Tests\Feature\Api\V1\Academics;

use App\Enums\AttendanceStatus;
use App\Enums\CohortStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\ProgressRating;
use App\Enums\StudentStatus;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_schedule_a_session_and_record_bulk_attendance(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        [$cohort, $students] = $this->createCohortWithStudents();

        $response = $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/sessions", [
                'title' => 'الحصة الأولى',
                'starts_at' => now()->subHours(2)->toIso8601String(),
                'ends_at' => now()->subMinutes(30)->toIso8601String(),
                'lesson_focus' => 'مهارات المحادثة',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'scheduled');

        $sessionId = $response->json('data.id');

        $this->actingAs($owner)
            ->putJson("/api/v1/class-sessions/{$sessionId}/attendance", [
                'records' => [
                    [
                        'student_id' => $students[0]->id,
                        'status' => AttendanceStatus::Present->value,
                    ],
                    [
                        'student_id' => $students[1]->id,
                        'status' => AttendanceStatus::Absent->value,
                    ],
                ],
                'complete_session' => true,
                'teacher_notes' => 'تم شرح الدرس بالكامل.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.attendance_summary.recorded', 2)
            ->assertJsonPath('data.attendance_summary.present', 1)
            ->assertJsonPath('data.attendance_summary.absent', 1);

        $this->actingAs($owner)
            ->getJson("/api/v1/cohorts/{$cohort->id}")
            ->assertOk()
            ->assertJsonPath('data.metrics.sessions_completed', 1)
            ->assertJsonPath('data.metrics.attendance_rate', 50)
            ->assertJsonCount(2, 'data.students');
    }

    public function test_staff_can_add_a_progress_entry_to_a_student(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        [$cohort, $students, $enrollments] = $this->createCohortWithStudents();

        $this->actingAs($owner)
            ->postJson("/api/v1/students/{$students[0]->id}/progress", [
                'enrollment_id' => $enrollments[0]->id,
                'level_id' => $cohort->level_id,
                'type' => 'speaking',
                'title' => 'تقييم المحادثة',
                'score' => 84,
                'rating' => ProgressRating::Good->value,
                'feedback' => 'تقدم واضح في الثقة.',
                'occurred_on' => today()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.score', '84.00')
            ->assertJsonPath('data.rating', ProgressRating::Good->value);

        $this->actingAs($owner)
            ->getJson("/api/v1/students/{$students[0]->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.progress_entries');
    }

    /**
     * @return array{Cohort, array<int, Student>, array<int, Enrollment>}
     */
    private function createCohortWithStudents(): array
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
        $cohort = Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 2400,
        ]);

        $students = [];
        $enrollments = [];

        foreach (['يوسف شريف', 'مريم خالد'] as $index => $name) {
            $students[$index] = Student::query()->create([
                'student_code' => sprintf('ES-2026-%03d', $index + 1),
                'full_name' => $name,
                'phone' => '0100000000'.$index,
                'status' => StudentStatus::Active,
                'joined_on' => today(),
            ]);
            $enrollments[$index] = Enrollment::query()->create([
                'student_id' => $students[$index]->id,
                'cohort_id' => $cohort->id,
                'status' => EnrollmentStatus::Active,
                'enrolled_on' => today(),
                'fee_amount' => 2400,
                'discount_amount' => 0,
                'net_amount' => 2400,
            ]);
        }

        return [$cohort, $students, $enrollments];
    }
}
