<?php

namespace App\Http\Resources\Api\V1\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_number' => $this->payment_number,
            'amount' => $this->amount,
            'method' => $this->method,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'reference' => $this->reference,
            'notes' => $this->notes,
            'recorder' => $this->whenLoaded('recorder', fn () => $this->recorder ? [
                'id' => $this->recorder->id,
                'name' => $this->recorder->name,
            ] : null),
        ];
    }
}
