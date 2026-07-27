<?php

namespace App\Http\Requests\Api\V1\Family;

use App\Enums\ServiceRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFamilyServiceRequest extends FormRequest
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
            'status' => ['required', Rule::enum(ServiceRequestStatus::class)],
            'assigned_to' => ['sometimes', 'nullable', 'ulid', 'exists:users,id'],
            'priority' => ['sometimes', Rule::in(['normal', 'high', 'urgent'])],
            'resolution' => ['nullable', 'string', 'max:5000', 'required_if:status,resolved,closed'],
        ];
    }
}
