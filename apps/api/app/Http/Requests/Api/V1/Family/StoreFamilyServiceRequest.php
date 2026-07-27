<?php

namespace App\Http\Requests\Api\V1\Family;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFamilyServiceRequest extends FormRequest
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
            'student_id' => ['nullable', 'ulid', 'exists:students,id'],
            'category' => ['required', Rule::in(['academic', 'schedule', 'billing', 'technical', 'complaint', 'other'])],
            'priority' => ['nullable', Rule::in(['normal', 'high'])],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
        ];
    }
}
