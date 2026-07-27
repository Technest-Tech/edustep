<?php

namespace App\Http\Resources\Api\V1\Students;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicInterventionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_risk_id' => $this->academic_risk_id,
            'type' => $this->type,
            'status' => $this->status->value,
            'title' => $this->title,
            'plan' => $this->plan,
            'due_on' => $this->due_on?->toDateString(),
            'outcome' => $this->outcome,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
