<?php

namespace App\Http\Resources\Api\V1\Students;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentProgressReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period_label' => $this->period_label,
            'period_starts_on' => $this->period_starts_on?->toDateString(),
            'period_ends_on' => $this->period_ends_on?->toDateString(),
            'status' => $this->status->value,
            'overall_score' => $this->overall_score,
            'overall_rating' => $this->overall_rating->value,
            'attendance_rate' => $this->attendance_rate,
            'summary' => $this->summary,
            'strengths' => $this->strengths,
            'areas_for_improvement' => $this->areas_for_improvement,
            'next_steps' => $this->next_steps,
            'published_at' => $this->published_at?->toIso8601String(),
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student->id,
                'student_code' => $this->student->student_code,
                'full_name' => $this->student->full_name,
            ]),
            'level' => $this->whenLoaded('level', fn () => $this->level ? [
                'id' => $this->level->id,
                'code' => $this->level->code,
                'name_ar' => $this->level->name_ar,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'publisher' => $this->whenLoaded('publisher', fn () => $this->publisher ? [
                'id' => $this->publisher->id,
                'name' => $this->publisher->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
