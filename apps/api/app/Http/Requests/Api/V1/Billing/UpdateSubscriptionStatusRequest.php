<?php

namespace App\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in(['active', 'frozen', 'completed', 'cancelled'])],
            'frozen_until' => ['nullable', 'required_if:status,frozen', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
