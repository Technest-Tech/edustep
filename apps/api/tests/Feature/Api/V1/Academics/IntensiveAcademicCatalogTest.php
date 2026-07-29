<?php

namespace Tests\Feature\Api\V1\Academics;

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
use Carbon\Carbon;
use Database\Seeders\AcademicCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IntensiveAcademicCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeder_installs_the_approved_tracks_levels_units_and_prices(): void
    {
        $this->seed(AcademicCatalogSeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);

        $this->assertDatabaseCount('curriculum_stages', 18);
        $this->assertDatabaseCount('curriculum_units', 108);
        $this->assertSame(
            5,
            Program::query()->where('catalog_version', 'intensive-v1.1')->count(),
        );
        $this->assertSame(
            37,
            Level::query()->where('catalog_version', 'intensive-v1.1')->count(),
        );
        $this->assertSame(
            37,
            StudyPackage::query()->where('source_version', 'intensive-v1.1')->count(),
        );

        $this->actingAs($owner)
            ->getJson('/api/v1/academic-catalog')
            ->assertOk()
            ->assertJsonPath('data.version', 'intensive-v1.1')
            ->assertJsonPath('data.policy.sessions_count', 16)
            ->assertJsonPath('data.policy.duration_weeks', 8)
            ->assertJsonCount(5, 'data.programs')
            ->assertJsonPath('data.programs.0.code', 'EARLY')
            ->assertJsonPath('data.programs.0.levels.0.default_package.price', '1800.00')
            ->assertJsonCount(6, 'data.programs.0.levels.0.curriculum.units');
    }

    public function test_new_group_inherits_capacity_price_duration_and_session_plan_from_level(): void
    {
        $this->seed(AcademicCatalogSeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher', 'status' => 'active']);
        $program = Program::query()->where('code', 'KIDS')->firstOrFail();
        $level = Level::query()
            ->where('program_id', $program->id)
            ->where('code', 'K1')
            ->firstOrFail();
        $package = StudyPackage::query()->where('level_id', $level->id)->firstOrFail();

        $response = $this->actingAs($owner)
            ->postJson('/api/v1/cohorts', [
                'program_id' => $program->id,
                'level_id' => $level->id,
                'study_package_id' => $package->id,
                'teacher_id' => $teacher->id,
                'code' => 'K1-NEW',
                'name' => 'Kids K1 · المجموعة الجديدة',
                'status' => CohortStatus::Enrolling->value,
                'delivery_mode' => 'online',
                'starts_on' => today()->toDateString(),
                'schedule' => [
                    ['day' => 'sunday', 'time' => '16:00'],
                    ['day' => 'wednesday', 'time' => '16:00'],
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.capacity', 8)
            ->assertJsonPath('data.fee', '1600.00')
            ->assertJsonPath('data.level.session_duration_minutes', 75)
            ->assertJsonPath('data.study_package.id', $package->id);

        $cohort = Cohort::query()->findOrFail($response->json('data.id'));
        $this->assertSame(
            today()->addWeeks(8)->subDay()->toDateString(),
            $cohort->ends_on->toDateString(),
        );

        $schedule = $this->actingAs($owner)
            ->postJson("/api/v1/cohorts/{$cohort->id}/generate-sessions", [
                'from' => today()->toDateString(),
                'to' => today()->addWeeks(12)->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.summary.created', 16)
            ->assertJsonPath('data.summary.target_sessions', 16)
            ->assertJsonPath('data.summary.remaining_sessions', 0);

        $this->assertDatabaseCount('class_sessions', 16);
        $this->assertEquals(
            75,
            Carbon::parse($schedule->json('data.sessions.0.starts_at'))
                ->diffInMinutes(Carbon::parse($schedule->json('data.sessions.0.ends_at'))),
        );
        $this->assertSame('engage_input', $schedule->json('data.sessions.0.cycle_phase'));
        $this->assertSame('review_check', $schedule->json('data.sessions.15.cycle_phase'));
    }

    public function test_full_payment_discount_and_two_installment_policy_are_applied_automatically(): void
    {
        $this->seed(AcademicCatalogSeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        $program = Program::query()->where('code', 'ADULTS')->firstOrFail();
        $level = Level::query()
            ->where('program_id', $program->id)
            ->where('code', 'A1.1')
            ->firstOrFail();
        $package = StudyPackage::query()->where('level_id', $level->id)->firstOrFail();
        [$student, $enrollment] = $this->studentInLevel($program, $level, 'ES-FULL');

        $this->actingAs($owner)
            ->postJson('/api/v1/billing/subscriptions', [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'study_package_id' => $package->id,
                'starts_on' => today()->addWeek()->toDateString(),
                'payment_plan' => 'full',
            ])
            ->assertCreated()
            ->assertJsonPath('data.price_amount', '1800.00')
            ->assertJsonPath('data.discount_amount', '90.00')
            ->assertJsonPath('data.net_amount', '1710.00')
            ->assertJsonCount(1, 'data.installments');

        [$secondStudent, $secondEnrollment] = $this->studentInLevel(
            $program,
            $level,
            'ES-INSTALLMENTS',
        );
        $installments = $this->actingAs($owner)
            ->postJson('/api/v1/billing/subscriptions', [
                'student_id' => $secondStudent->id,
                'enrollment_id' => $secondEnrollment->id,
                'study_package_id' => $package->id,
                'starts_on' => today()->addWeek()->toDateString(),
                'payment_plan' => 'installments',
            ])
            ->assertCreated()
            ->assertJsonCount(2, 'data.installments');

        $this->assertSame('900.00', $installments->json('data.installments.0.amount'));
        $this->assertSame('900.00', $installments->json('data.installments.1.amount'));
        $this->assertSame(
            today()->addWeek()->addWeeks(4)->subDays(2)->toDateString(),
            $installments->json('data.installments.1.due_on'),
        );
    }

    /**
     * @return array{Student, Enrollment}
     */
    private function studentInLevel(Program $program, Level $level, string $code): array
    {
        $cohort = Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'study_package_id' => StudyPackage::query()->where('level_id', $level->id)->value('id'),
            'code' => $code.'-GROUP',
            'name' => $code.' Group',
            'status' => CohortStatus::Enrolling,
            'capacity' => 10,
            'fee' => 1800,
        ]);
        $student = Student::query()->create([
            'student_code' => $code,
            'full_name' => $code,
            'phone' => '01000000000',
            'status' => StudentStatus::Active,
            'joined_on' => today(),
        ]);
        $enrollment = Enrollment::query()->create([
            'student_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => EnrollmentStatus::Active,
            'enrolled_on' => today(),
            'fee_amount' => 1800,
            'discount_amount' => 0,
            'net_amount' => 1800,
        ]);

        return [$student, $enrollment];
    }
}
