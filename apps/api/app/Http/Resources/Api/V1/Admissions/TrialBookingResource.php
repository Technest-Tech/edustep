<?php

namespace App\Http\Resources\Api\V1\Admissions;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrialBookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'meeting_url' => $this->meeting_url,
            'room_name' => $this->room_name,
            'notes' => $this->notes,
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'attended_at' => $this->attended_at?->toIso8601String(),
            'lead' => $this->whenLoaded('lead', fn () => [
                'id' => $this->lead->id,
                'full_name' => $this->lead->full_name,
                'phone' => $this->lead->phone,
            ]),
            'cohort' => $this->whenLoaded('cohort', fn () => [
                'id' => $this->cohort->id,
                'code' => $this->cohort->code,
                'name' => $this->cohort->name,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
