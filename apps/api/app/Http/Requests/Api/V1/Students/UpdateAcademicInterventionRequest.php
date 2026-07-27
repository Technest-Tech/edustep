<?php

namespace App\Http\Requests\Api\V1\Students;

use App\Enums\InterventionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicInterventionRequest extends FormRequest
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
            'status' => ['required', Rule::enum(InterventionStatus::class)],
            'outcome' => ['nullable', 'string', 'max:5000', 'required_if:status,completed'],
        ];
    }
}
