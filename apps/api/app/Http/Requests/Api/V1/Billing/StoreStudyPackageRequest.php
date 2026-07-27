<?php

namespace App\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudyPackageRequest extends FormRequest
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
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'level_id' => [
                'nullable',
                'ulid',
                Rule::exists('levels', 'id')->where('program_id', $this->input('program_id')),
            ],
            'code' => ['required', 'string', 'max:50', 'unique:study_packages,code'],
            'name' => ['required', 'string', 'max:255'],
            'sessions_count' => ['required', 'integer', 'min:1', 'max:200'],
            'duration_weeks' => ['required', 'integer', 'min:1', 'max:104'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'default_installments' => ['required', 'integer', 'min:1', 'max:12'],
            'description' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
