<?php

namespace App\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;

class RenewSubscriptionRequest extends FormRequest
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
            'study_package_id' => ['nullable', 'ulid', 'exists:study_packages,id'],
            'starts_on' => ['nullable', 'date'],
            'installment_count' => ['nullable', 'integer', 'min:1', 'max:12'],
            'discount_amount' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
