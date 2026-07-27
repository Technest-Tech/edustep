<?php

namespace App\Http\Requests\Api\V1\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class StoreSeatRequest extends FormRequest
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
            'hold_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
