<?php

namespace App\Modules\Academics\Actions;

use App\Enums\AttendanceStatus;
use App\Enums\ClassSessionStatus;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use App\Models\Student;
use App\Models\User;
use App\Modules\Finance\Actions\GenerateTeacherEarning;
use Illuminate\Support\Facades\DB;

class RecordSessionAttendance
{
    public function __construct(
        private readonly GenerateTeacherEarning $generateTeacherEarning,
        private readonly EvaluateStudentAcademicRisk $evaluateStudentAcademicRisk,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    public function execute(
        ClassSession $classSession,
        array $records,
        User $actor,
        bool $completeSession = false,
        ?string $teacherNotes = null,
    ): ClassSession {
        return DB::transaction(function () use (
            $classSession,
            $records,
            $actor,
            $completeSession,
            $teacherNotes,
        ): ClassSession {
            foreach ($records as $record) {
                $status = AttendanceStatus::from($record['status']);

                AttendanceRecord::query()->updateOrCreate(
                    [
                        'class_session_id' => $classSession->id,
                        'student_id' => $record['student_id'],
                    ],
                    [
                        'recorded_by' => $actor->id,
                        'status' => $status,
                        'checked_in_at' => in_array($status, [AttendanceStatus::Present, AttendanceStatus::Late], true)
                            ? now()
                            : null,
                        'notes' => $record['notes'] ?? null,
                    ],
                );
            }

            collect($records)
                ->pluck('student_id')
                ->unique()
                ->each(fn (string $studentId) => $this->evaluateStudentAcademicRisk->execute(
                    Student::query()->findOrFail($studentId),
                ));

            if ($completeSession) {
                $classSession->update([
                    'status' => ClassSessionStatus::Completed,
                    'completed_at' => now(),
                    'teacher_notes' => $teacherNotes,
                ]);
                $this->generateTeacherEarning->execute($classSession->fresh());
            } elseif ($teacherNotes !== null) {
                $classSession->update(['teacher_notes' => $teacherNotes]);
            }

            return $classSession->fresh()->load(['teacher', 'attendanceRecords.student']);
        });
    }
}
