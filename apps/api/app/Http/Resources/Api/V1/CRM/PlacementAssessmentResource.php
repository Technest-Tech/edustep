<?php

namespace App\Http\Resources\Api\V1\CRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlacementAssessmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'score' => $this->score,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'notes' => $this->notes,
            'assessor' => $this->whenLoaded('assessor', fn () => [
                'id' => $this->assessor?->id,
                'name' => $this->assessor?->name,
            ]),
            'recommended_level' => $this->whenLoaded('recommendedLevel', fn () => $this->recommendedLevel ? [
                'id' => $this->recommendedLevel->id,
                'code' => $this->recommendedLevel->code,
                'name_ar' => $this->recommendedLevel->name_ar,
            ] : null),
        ];
    }
}
