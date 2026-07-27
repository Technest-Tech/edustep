<?php

namespace App\Http\Resources\Api\V1\Students;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attendanceRecords = $this->relationLoaded('attendanceRecords')
            ? $this->attendanceRecords
            : collect();
        $effectiveAttendance = $attendanceRecords->filter(
            fn ($record) => $record->status->value !== 'excused',
        );
        $attended = $effectiveAttendance->filter(
            fn ($record) => in_array($record->status->value, ['present', 'late'], true),
        );

        return [
            'id' => $this->id,
            'student_code' => $this->student_code,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => $this->guardian_phone,
            'status' => $this->status->value,
            'joined_on' => $this->joined_on?->toDateString(),
            'notes' => $this->notes,
            'enrollments' => $this->whenLoaded('enrollments', fn () => $this->enrollments->map(fn ($enrollment) => [
                'id' => $enrollment->id,
                'status' => $enrollment->status->value,
                'enrolled_on' => $enrollment->enrolled_on?->toDateString(),
                'fee_amount' => $enrollment->fee_amount,
                'discount_amount' => $enrollment->discount_amount,
                'net_amount' => $enrollment->net_amount,
                'cohort' => $enrollment->relationLoaded('cohort') ? [
                    'id' => $enrollment->cohort->id,
                    'code' => $enrollment->cohort->code,
                    'name' => $enrollment->cohort->name,
                    'level' => $enrollment->cohort->relationLoaded('level') ? [
                        'id' => $enrollment->cohort->level->id,
                        'code' => $enrollment->cohort->level->code,
                        'name_ar' => $enrollment->cohort->level->name_ar,
                    ] : null,
                ] : null,
            ])),
            'attendance_summary' => $this->when(
                $this->relationLoaded('attendanceRecords'),
                fn () => [
                    'records' => $attendanceRecords->count(),
                    'absences' => $attendanceRecords->filter(
                        fn ($record) => $record->status->value === 'absent',
                    )->count(),
                    'rate' => $effectiveAttendance->count()
                        ? round(($attended->count() / $effectiveAttendance->count()) * 100, 1)
                        : 0,
                ],
            ),
            'progress_entries' => ProgressEntryResource::collection(
                $this->whenLoaded('progressEntries'),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
