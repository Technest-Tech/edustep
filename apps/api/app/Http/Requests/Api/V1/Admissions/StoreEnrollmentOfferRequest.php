<?php

namespace App\Http\Requests\Api\V1\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cohort_id' => ['required', 'ulid', 'exists:cohorts,id'],
            'price_amount' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0', 'lte:price_amount'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'hold_seat' => ['nullable', 'boolean'],
            'hold_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'send_now' => ['nullable', 'boolean'],
        ];
    }
}
