<?php

namespace App\Http\Resources\Api\V1\Academics;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $records = $this->relationLoaded('attendanceRecords')
            ? $this->attendanceRecords
            : collect();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status->value,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'meeting_url' => $this->meeting_url,
            'room_name' => $this->room_name,
            'lesson_focus' => $this->lesson_focus,
            'teacher_notes' => $this->teacher_notes,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'teacher' => $this->whenLoaded('teacher', fn () => $this->teacher ? [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
            ] : null),
            'cohort' => $this->whenLoaded('cohort', fn () => $this->cohort ? [
                'id' => $this->cohort->id,
                'code' => $this->cohort->code,
                'name' => $this->cohort->name,
                'delivery_mode' => $this->cohort->delivery_mode,
                'program' => $this->cohort->relationLoaded('program')
                    ? $this->cohort->program?->name_ar
                    : null,
                'level' => $this->cohort->relationLoaded('level')
                    ? $this->cohort->level?->name_ar
                    : null,
            ] : null),
            'teacher_earning' => $this->whenLoaded('teacherEarning', fn () => $this->teacherEarning ? [
                'id' => $this->teacherEarning->id,
                'status' => $this->teacherEarning->status->value,
                'amount' => $this->teacherEarning->amount,
            ] : null),
            'attendance_summary' => [
                'recorded' => $records->count(),
                'present' => $records->filter(fn ($record) => $record->status->value === 'present')->count(),
                'late' => $records->filter(fn ($record) => $record->status->value === 'late')->count(),
                'absent' => $records->filter(fn ($record) => $record->status->value === 'absent')->count(),
                'excused' => $records->filter(fn ($record) => $record->status->value === 'excused')->count(),
            ],
            'attendance_records' => AttendanceRecordResource::collection(
                $this->whenLoaded('attendanceRecords'),
            ),
        ];
    }
}
