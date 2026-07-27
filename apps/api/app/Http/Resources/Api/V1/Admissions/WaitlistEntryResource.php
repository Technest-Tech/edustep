<?php

namespace App\Http\Resources\Api\V1\Admissions;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WaitlistEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'priority' => $this->priority,
            'joined_at' => $this->joined_at?->toIso8601String(),
            'offered_until' => $this->offered_until?->toIso8601String(),
            'notes' => $this->notes,
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
