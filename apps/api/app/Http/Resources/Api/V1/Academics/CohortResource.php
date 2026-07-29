<?php

namespace App\Http\Resources\Api\V1\Academics;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CohortResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $enrolledCount = (int) ($this->enrollments_count ?? 0);
        $reservedCount = (int) ($this->seat_reservations_count ?? 0);
        $waitlistCount = (int) ($this->waitlist_entries_count ?? 0);

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'status' => $this->status->value,
            'delivery_mode' => $this->delivery_mode,
            'capacity' => $this->capacity,
            'enrolled_count' => $enrolledCount,
            'reserved_seats' => $reservedCount,
            'waitlist_count' => $waitlistCount,
            'available_seats' => max(0, $this->capacity - $enrolledCount - $reservedCount),
            'fee' => $this->fee,
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'schedule' => $this->schedule,
            'timezone' => $this->timezone,
            'meeting_url' => $this->meeting_url,
            'room_name' => $this->room_name,
            'program' => $this->whenLoaded('program', fn () => [
                'id' => $this->program->id,
                'code' => $this->program->code,
                'name_ar' => $this->program->name_ar,
            ]),
            'level' => $this->whenLoaded('level', fn () => [
                'id' => $this->level->id,
                'code' => $this->level->code,
                'name_ar' => $this->level->name_ar,
                'cefr_reference' => $this->level->cefr_reference,
                'sessions_count' => $this->level->sessions_count,
                'duration_weeks' => $this->level->duration_weeks,
                'sessions_per_week' => $this->level->sessions_per_week,
                'session_duration_minutes' => $this->level->session_duration_minutes,
                'minimum_group_size' => $this->level->minimum_group_size,
                'maximum_group_size' => $this->level->maximum_group_size,
            ]),
            'study_package' => $this->whenLoaded('studyPackage', fn () => $this->studyPackage ? [
                'id' => $this->studyPackage->id,
                'code' => $this->studyPackage->code,
                'name' => $this->studyPackage->name,
                'sessions_count' => $this->studyPackage->sessions_count,
                'duration_weeks' => $this->studyPackage->duration_weeks,
                'price' => $this->studyPackage->price,
            ] : null),
            'teacher' => $this->whenLoaded('teacher', fn () => $this->teacher ? [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
            ] : null),
        ];
    }
}
