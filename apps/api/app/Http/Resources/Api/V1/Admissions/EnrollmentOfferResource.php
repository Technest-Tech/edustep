<?php

namespace App\Http\Resources\Api\V1\Admissions;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'offer_number' => $this->offer_number,
            'status' => $this->status->value,
            'price_amount' => $this->price_amount,
            'discount_amount' => $this->discount_amount,
            'net_amount' => $this->net_amount,
            'valid_until' => $this->valid_until?->toDateString(),
            'is_expired' => $this->valid_until?->lt(today())
                && ! in_array($this->status->value, ['accepted', 'declined', 'cancelled'], true),
            'notes' => $this->notes,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'declined_at' => $this->declined_at?->toIso8601String(),
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
            'seat_reservation' => $this->whenLoaded('seatReservation', fn () => $this->seatReservation ? [
                'id' => $this->seatReservation->id,
                'status' => $this->seatReservation->status->value,
                'reserved_until' => $this->seatReservation->reserved_until?->toIso8601String(),
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
