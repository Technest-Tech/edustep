<?php

namespace App\Http\Resources\Api\V1\CRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nextFollowUp = $this->relationLoaded('followUps')
            ? $this->followUps->first()
            : null;

        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'whatsapp_phone' => $this->whatsapp_phone,
            'email' => $this->email,
            'source' => [
                'value' => $this->source->value,
                'label' => $this->source->label(),
            ],
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
            ],
            'learner_age' => $this->learner_age,
            'preferred_schedule' => $this->preferred_schedule,
            'program' => $this->whenLoaded('interestedProgram', fn () => $this->interestedProgram ? [
                'id' => $this->interestedProgram->id,
                'name_ar' => $this->interestedProgram->name_ar,
                'code' => $this->interestedProgram->code,
            ] : null),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),
            'next_follow_up' => $nextFollowUp ? new FollowUpResource($nextFollowUp) : null,
            'last_contacted_at' => $this->last_contacted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
