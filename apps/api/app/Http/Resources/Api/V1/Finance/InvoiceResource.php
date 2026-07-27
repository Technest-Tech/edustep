<?php

namespace App\Http\Resources\Api\V1\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status->value,
            'issued_on' => $this->issued_on?->toDateString(),
            'due_on' => $this->due_on?->toDateString(),
            'subtotal' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'balance' => $this->balance,
            'is_overdue' => $this->due_on?->isPast() && (float) $this->balance > 0,
            'notes' => $this->notes,
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student->id,
                'student_code' => $this->student->student_code,
                'full_name' => $this->student->full_name,
                'phone' => $this->student->phone,
            ]),
            'enrollment' => $this->whenLoaded('enrollment', fn () => $this->enrollment ? [
                'id' => $this->enrollment->id,
                'cohort' => $this->enrollment->relationLoaded('cohort') ? [
                    'id' => $this->enrollment->cohort->id,
                    'name' => $this->enrollment->cohort->name,
                    'code' => $this->enrollment->cohort->code,
                ] : null,
            ] : null),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
