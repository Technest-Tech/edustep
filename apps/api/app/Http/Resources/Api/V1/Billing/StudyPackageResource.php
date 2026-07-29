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
        $price = (float) $this->price;
        $discountPercent = (float) $this->full_payment_discount_percent;
        $fullPaymentPrice = round($price * (1 - ($discountPercent / 100)), 2);
        $installmentCount = max(1, (int) $this->default_installments);
        $installmentAmount = round($price / $installmentCount, 2);

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'sessions_count' => $this->sessions_count,
            'duration_weeks' => $this->duration_weeks,
            'price' => $this->price,
            'standard_price' => $this->standard_price,
            'full_payment_discount_percent' => $this->full_payment_discount_percent,
            'full_payment_price' => number_format($fullPaymentPrice, 2, '.', ''),
            'default_installments' => $this->default_installments,
            'default_installment_amount' => number_format($installmentAmount, 2, '.', ''),
            'second_installment_session' => $this->second_installment_session,
            'second_installment_due_days_before' => $this->second_installment_due_days_before,
            'source_version' => $this->source_version,
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
