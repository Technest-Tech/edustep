<?php

namespace App\Http\Resources\Api\V1\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentSubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $installments = $this->relationLoaded('installments')
            ? $this->installments
            : collect();
        $paidAmount = $installments->sum(
            fn ($installment) => (float) ($installment->invoice?->paid_amount ?? 0),
        );

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'renewal_due_on' => $this->renewal_due_on?->toDateString(),
            'days_remaining' => today()->lte($this->ends_on)
                ? today()->diffInDays($this->ends_on)
                : 0,
            'included_sessions' => $this->included_sessions,
            'price_amount' => $this->price_amount,
            'discount_amount' => $this->discount_amount,
            'net_amount' => $this->net_amount,
            'paid_amount' => number_format($paidAmount, 2, '.', ''),
            'outstanding_amount' => number_format(
                max(0, (float) $this->net_amount - $paidAmount),
                2,
                '.',
                '',
            ),
            'frozen_at' => $this->frozen_at?->toIso8601String(),
            'frozen_until' => $this->frozen_until?->toDateString(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
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
                    'code' => $this->enrollment->cohort->code,
                    'name' => $this->enrollment->cohort->name,
                ] : null,
            ] : null),
            'package' => $this->whenLoaded('studyPackage', fn () => [
                'id' => $this->studyPackage->id,
                'code' => $this->studyPackage->code,
                'name' => $this->studyPackage->name,
                'sessions_count' => $this->studyPackage->sessions_count,
                'duration_weeks' => $this->studyPackage->duration_weeks,
            ]),
            'parent_subscription_id' => $this->parent_subscription_id,
            'installments' => $installments->map(fn ($installment) => [
                'id' => $installment->id,
                'installment_number' => $installment->installment_number,
                'amount' => $installment->amount,
                'due_on' => $installment->due_on->toDateString(),
                'status' => $installment->status->value,
                'paid_at' => $installment->paid_at?->toIso8601String(),
                'invoice' => $installment->invoice ? [
                    'id' => $installment->invoice->id,
                    'invoice_number' => $installment->invoice->invoice_number,
                    'status' => $installment->invoice->status->value,
                    'paid_amount' => $installment->invoice->paid_amount,
                    'balance' => $installment->invoice->balance,
                ] : null,
            ])->values(),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
