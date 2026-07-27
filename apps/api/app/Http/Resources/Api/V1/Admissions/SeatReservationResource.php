<?php

namespace App\Http\Resources\Api\V1\Admissions;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeatReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'reserved_until' => $this->reserved_until?->toIso8601String(),
            'converted_at' => $this->converted_at?->toIso8601String(),
            'released_at' => $this->released_at?->toIso8601String(),
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
            'offer_id' => $this->enrollment_offer_id,
            'reserver' => $this->whenLoaded('reserver', fn () => $this->reserver ? [
                'id' => $this->reserver->id,
                'name' => $this->reserver->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
