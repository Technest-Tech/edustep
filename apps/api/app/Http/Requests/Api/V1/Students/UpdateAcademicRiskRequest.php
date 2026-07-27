<?php

namespace App\Http\Requests\Api\V1\Students;

use App\Enums\AcademicRiskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicRiskRequest extends FormRequest
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
            'status' => ['required', Rule::enum(AcademicRiskStatus::class)],
            'severity' => ['sometimes', Rule::in(['low', 'medium', 'high', 'critical'])],
            'assigned_to' => ['sometimes', 'nullable', 'ulid', 'exists:users,id'],
        ];
    }
}
