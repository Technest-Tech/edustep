<?php

namespace App\Http\Requests\Api\V1\Admissions;

use App\Enums\TrialBookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrialBookingRequest extends FormRequest
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
            'status' => ['required', Rule::enum(TrialBookingStatus::class)],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
