<?php

namespace App\Http\Resources\Api\V1\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudyPackageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'sessions_count' => $this->sessions_count,
            'duration_weeks' => $this->duration_weeks,
            'price' => $this->price,
            'default_installments' => $this->default_installments,
            'is_active' => $this->is_active,
            'description' => $this->description,
            'program' => $this->whenLoaded('program', fn () => [
                'id' => $this->program->id,
                'code' => $this->program->code,
                'name_ar' => $this->program->name_ar,
            ]),
            'level' => $this->whenLoaded('level', fn () => $this->level ? [
                'id' => $this->level->id,
                'code' => $this->level->code,
                'name_ar' => $this->level->name_ar,
            ] : null),
            'subscriptions_count' => $this->whenCounted('subscriptions'),
        ];
    }
}
