<?php

namespace App\Http\Resources\Api\V1\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherEarningResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'duration_minutes' => $this->duration_minutes,
            'rate_type' => $this->rate_type->value,
            'rate_amount' => $this->rate_amount,
            'amount' => $this->amount,
            'earned_on' => $this->earned_on?->toDateString(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'teacher' => $this->whenLoaded('teacher', fn () => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
            ]),
            'session' => $this->whenLoaded('classSession', fn () => [
                'id' => $this->classSession->id,
                'title' => $this->classSession->title,
                'starts_at' => $this->classSession->starts_at?->toIso8601String(),
                'cohort' => $this->classSession->relationLoaded('cohort') ? [
                    'id' => $this->classSession->cohort->id,
                    'name' => $this->classSession->cohort->name,
                    'code' => $this->classSession->cohort->code,
                ] : null,
            ]),
        ];
    }
}
