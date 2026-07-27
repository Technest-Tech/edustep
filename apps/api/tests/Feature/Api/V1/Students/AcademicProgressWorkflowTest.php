<?php

namespace Tests\Feature\Api\V1\Students;

use App\Models\GuardianProfile;
use App\Models\Student;
use App\Models\StudentProgressReport;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicProgressWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_review_progress_publish_a_report_and_notify_the_family(): void
    {
        $this->seed(DatabaseSeeder::class);
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();
        $guardian = User::query()->where('email', 'parent@edustep.local')->firstOrFail();
        $draft = StudentProgressReport::query()->where('status', 'draft')->firstOrFail();

        $this->actingAs($owner)
            ->getJson('/api/v1/academic-progress')
            ->assertOk()
            ->assertJsonPath('data.summary.students', 6)
            ->assertJsonPath('data.summary.at_risk', 1)
            ->assertJsonPath('data.summary.draft_reports', 1);

        $this->actingAs($owner)
            ->postJson("/api/v1/progress-reports/{$draft->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.publisher.id', $owner->id);

        $this->assertDatabaseHas('messages', [
            'student_id' => $draft->student_id,
            'status' => 'delivered',
        ]);

        $this->actingAs($guardian)
            ->getJson('/api/v1/family/home')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $draft->id,
                'status' => 'published',
            ]);
    }

    public function test_low_scores_create_an_automatic_performance_risk(): void
    {
        $this->seed(DatabaseSeeder::class);
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();
        $student = Student::query()->where('student_code', 'ES-2026-006')->firstOrFail();
        $enrollment = $student->enrollments()->with('cohort')->firstOrFail();

        foreach ([46, 42, 44] as $index => $score) {
            $this->actingAs($owner)
                ->postJson("/api/v1/students/{$student->id}/progress", [
                    'enrollment_id' => $enrollment->id,
                    'level_id' => $enrollment->cohort->level_id,
                    'type' => 'assessment',
                    'title' => 'تقييم متابعة '.($index + 1),
                    'score' => $score,
                    'rating' => 'needs_improvement',
                    'feedback' => 'يحتاج إلى خطة دعم مركزة.',
                    'occurred_on' => today()->subDays(2 - $index)->toDateString(),
                ])
                ->assertCreated();
        }

        $this->assertDatabaseHas('academic_risks', [
            'student_id' => $student->id,
            'type' => 'performance',
            'severity' => 'high',
            'status' => 'open',
            'is_automatic' => true,
        ]);
    }

    public function test_guardian_can_open_a_scoped_request_and_staff_can_resolve_it(): void
    {
        $this->seed(DatabaseSeeder::class);
        $guardianUser = User::query()->where('email', 'parent@edustep.local')->firstOrFail();
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();
        $guardian = GuardianProfile::query()->where('user_id', $guardianUser->id)->firstOrFail();
        $linkedStudent = $guardian->students()->firstOrFail();
        $unlinkedStudent = Student::query()
            ->whereDoesntHave('guardians', fn ($query) => $query->whereKey($guardian->id))
            ->firstOrFail();

        $request = $this->actingAs($guardianUser)
            ->postJson('/api/v1/family/service-requests', [
                'student_id' => $linkedStudent->id,
                'category' => 'academic',
                'priority' => 'high',
                'subject' => 'متابعة خطة الطالب',
                'description' => 'نحتاج مكالمة قصيرة لمناقشة الخطوات القادمة.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.student.id', $linkedStudent->id);

        $this->actingAs($guardianUser)
            ->postJson('/api/v1/family/service-requests', [
                'student_id' => $unlinkedStudent->id,
                'category' => 'academic',
                'subject' => 'طلب غير مسموح',
                'description' => 'يجب ألا يتم إنشاء هذا الطلب.',
            ])
            ->assertForbidden();

        $this->actingAs($owner)
            ->patchJson('/api/v1/service-requests/'.$request->json('data.id'), [
                'status' => 'resolved',
                'assigned_to' => $owner->id,
                'resolution' => 'تم التواصل ومشاركة الخطة.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.assignee.id', $owner->id);
    }

    public function test_teacher_cannot_manage_reports_for_students_outside_their_groups(): void
    {
        $this->seed(DatabaseSeeder::class);
        $teacher = User::query()->where('email', 'mahmoud@edustep.local')->firstOrFail();
        $student = Student::query()->where('student_code', 'ES-2026-001')->firstOrFail();
        $enrollment = $student->enrollments()->with('cohort')->firstOrFail();

        $this->actingAs($teacher)
            ->postJson("/api/v1/students/{$student->id}/progress-reports", [
                'enrollment_id' => $enrollment->id,
                'level_id' => $enrollment->cohort->level_id,
                'period_label' => 'تقرير غير مسموح',
                'period_starts_on' => today()->startOfMonth()->toDateString(),
                'period_ends_on' => today()->toDateString(),
                'overall_rating' => 'good',
                'summary' => 'محاولة خارج نطاق المعلم.',
            ])
            ->assertForbidden();
    }
}
