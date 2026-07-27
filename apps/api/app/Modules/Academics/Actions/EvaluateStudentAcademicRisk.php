<?php

namespace App\Modules\Academics\Actions;

use App\Enums\AcademicRiskStatus;
use App\Models\AcademicRisk;
use App\Models\Student;

class EvaluateStudentAcademicRisk
{
    public function execute(Student $student): void
    {
        $student->loadMissing(['attendanceRecords', 'progressEntries', 'enrollments.cohort']);
        $activeEnrollment = $student->enrollments
            ->first(fn ($enrollment) => $enrollment->status->value === 'active');
        $assignee = $activeEnrollment?->cohort?->teacher_id;

        $attendance = $student->attendanceRecords
            ->sortByDesc('created_at')
            ->take(8)
            ->filter(fn ($record) => $record->status->value !== 'excused');

        if ($attendance->count() >= 3) {
            $attended = $attendance->filter(
                fn ($record) => in_array($record->status->value, ['present', 'late'], true),
            )->count();
            $rate = round(($attended / $attendance->count()) * 100, 1);

            $this->syncRisk(
                student: $student,
                enrollmentId: $activeEnrollment?->id,
                assigneeId: $assignee,
                type: 'attendance',
                shouldOpen: $rate < 75,
                shouldResolve: $rate >= 80,
                severity: $rate < 50 ? 'critical' : ($rate < 65 ? 'high' : 'medium'),
                title: 'انخفاض انتظام الحضور',
                description: "نسبة الحضور في آخر {$attendance->count()} حصص هي {$rate}%.",
                metadata: ['attendance_rate' => $rate, 'sample_size' => $attendance->count()],
            );
        }

        $scores = $student->progressEntries
            ->sortByDesc('occurred_on')
            ->whereNotNull('score')
            ->take(5)
            ->map(fn ($entry) => (float) $entry->score);

        if ($scores->count() >= 3) {
            $average = round($scores->average(), 1);

            $this->syncRisk(
                student: $student,
                enrollmentId: $activeEnrollment?->id,
                assigneeId: $assignee,
                type: 'performance',
                shouldOpen: $average < 65,
                shouldResolve: $average >= 70,
                severity: $average < 50 ? 'critical' : ($average < 60 ? 'high' : 'medium'),
                title: 'تراجع متوسط التقييمات',
                description: "متوسط آخر {$scores->count()} تقييمات هو {$average} من 100.",
                metadata: ['average_score' => $average, 'sample_size' => $scores->count()],
            );
        }
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function syncRisk(
        Student $student,
        ?string $enrollmentId,
        ?string $assigneeId,
        string $type,
        bool $shouldOpen,
        bool $shouldResolve,
        string $severity,
        string $title,
        string $description,
        array $metadata,
    ): void {
        $risk = AcademicRisk::query()
            ->where('student_id', $student->id)
            ->where('type', $type)
            ->where('is_automatic', true)
            ->where('status', '!=', AcademicRiskStatus::Resolved)
            ->latest()
            ->first();

        if ($shouldOpen) {
            ($risk ?? new AcademicRisk)->fill([
                'student_id' => $student->id,
                'enrollment_id' => $enrollmentId,
                'assigned_to' => $assigneeId,
                'type' => $type,
                'severity' => $severity,
                'status' => AcademicRiskStatus::Open,
                'title' => $title,
                'description' => $description,
                'is_automatic' => true,
                'detected_at' => $risk?->detected_at ?? now(),
                'resolved_at' => null,
                'metadata' => $metadata,
            ])->save();

            return;
        }

        if ($risk && $shouldResolve) {
            $risk->update([
                'status' => AcademicRiskStatus::Resolved,
                'resolved_at' => now(),
                'metadata' => $metadata,
            ]);
        }
    }
}
