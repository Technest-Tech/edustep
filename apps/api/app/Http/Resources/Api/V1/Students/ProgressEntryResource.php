<?php

namespace App\Http\Resources\Api\V1\Students;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgressEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'score' => $this->score,
            'rating' => $this->rating->value,
            'feedback' => $this->feedback,
            'occurred_on' => $this->occurred_on?->toDateString(),
            'level' => $this->whenLoaded('level', fn () => $this->level ? [
                'id' => $this->level->id,
                'code' => $this->level->code,
                'name_ar' => $this->level->name_ar,
            ] : null),
            'evaluator' => $this->whenLoaded('evaluator', fn () => $this->evaluator ? [
                'id' => $this->evaluator->id,
                'name' => $this->evaluator->name,
            ] : null),
        ];
    }
}
