<?php

namespace App\Http\Resources\Api\V1\Students;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicRiskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'severity' => $this->severity,
            'status' => $this->status->value,
            'title' => $this->title,
            'description' => $this->description,
            'is_automatic' => $this->is_automatic,
            'detected_at' => $this->detected_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'metadata' => $this->metadata,
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'interventions' => AcademicInterventionResource::collection(
                $this->whenLoaded('interventions'),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
