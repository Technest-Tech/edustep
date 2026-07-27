<?php

namespace App\Http\Resources\Api\V1\Academics;

use App\Http\Resources\Api\V1\Admissions\WaitlistEntryResource;
use App\Http\Resources\Api\V1\Students\ProgressEntryResource;
use Illuminate\Http\Request;

class CohortDetailResource extends CohortResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $sessions = $this->classSessions;
        $records = $sessions->flatMap(fn ($session) => $session->attendanceRecords);
        $effectiveRecords = $records->filter(fn ($record) => $record->status->value !== 'excused');
        $attendedRecords = $effectiveRecords->filter(
            fn ($record) => in_array($record->status->value, ['present', 'late'], true),
        );
        $enrollments = $this->enrollments->filter(fn ($enrollment) => $enrollment->status->value === 'active');

        return [
            ...parent::toArray($request),
            'metrics' => [
                'sessions_total' => $sessions->count(),
                'sessions_completed' => $sessions->filter(
                    fn ($session) => $session->status->value === 'completed',
                )->count(),
                'sessions_upcoming' => $sessions->filter(
                    fn ($session) => $session->status->value === 'scheduled' && $session->starts_at->isFuture(),
                )->count(),
                'attendance_rate' => $effectiveRecords->count()
                    ? round(($attendedRecords->count() / $effectiveRecords->count()) * 100, 1)
                    : 0,
                'collected_enrollment_value' => number_format(
                    (float) $enrollments->sum('net_amount'),
                    2,
                    '.',
                    '',
                ),
            ],
            'sessions' => ClassSessionResource::collection($sessions),
            'waitlist' => WaitlistEntryResource::collection($this->whenLoaded('waitlistEntries')),
            'students' => $enrollments->map(function ($enrollment) use ($records): array {
                $studentRecords = $records->where('student_id', $enrollment->student_id);
                $effectiveRecords = $studentRecords->filter(
                    fn ($record) => $record->status->value !== 'excused',
                );
                $attendedRecords = $effectiveRecords->filter(
                    fn ($record) => in_array($record->status->value, ['present', 'late'], true),
                );

                return [
                    'id' => $enrollment->student->id,
                    'student_code' => $enrollment->student->student_code,
                    'full_name' => $enrollment->student->full_name,
                    'phone' => $enrollment->student->phone,
                    'guardian_name' => $enrollment->student->guardian_name,
                    'guardian_phone' => $enrollment->student->guardian_phone,
                    'enrollment_id' => $enrollment->id,
                    'attendance_rate' => $effectiveRecords->count()
                        ? round(($attendedRecords->count() / $effectiveRecords->count()) * 100, 1)
                        : 0,
                    'absences' => $studentRecords->filter(
                        fn ($record) => $record->status->value === 'absent',
                    )->count(),
                    'latest_progress' => ProgressEntryResource::collection(
                        $enrollment->student->progressEntries->take(3),
                    ),
                ];
            })->values(),
        ];
    }
}
