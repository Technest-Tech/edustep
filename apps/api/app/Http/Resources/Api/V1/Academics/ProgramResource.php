<?php

namespace App\Http\Resources\Api\V1\Academics;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'levels' => LevelResource::collection($this->whenLoaded('levels')),
        ];
    }
}
