<?php

namespace App\Http\Resources\Api\V1\CRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'channel' => $this->channel,
            'direction' => $this->direction,
            'title' => $this->title,
            'details' => $this->details,
            'metadata' => $this->metadata,
            'occurred_at' => $this->occurred_at?->toIso8601String(),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
            ]),
        ];
    }
}
