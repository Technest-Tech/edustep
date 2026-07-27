<?php

namespace App\Http\Requests\Api\V1\CRM;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
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
            'full_name' => ['sometimes', 'string', 'max:150'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'whatsapp_phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'source' => ['sometimes', Rule::enum(LeadSource::class)],
            'status' => ['sometimes', Rule::enum(LeadStatus::class)],
            'interested_program_id' => ['nullable', 'ulid', 'exists:programs,id'],
            'owner_id' => ['nullable', 'ulid', 'exists:users,id'],
            'preferred_contact_channel' => ['sometimes', 'string', 'in:whatsapp,phone,email'],
            'preferred_schedule' => ['nullable', 'string', 'max:100'],
            'learner_age' => ['nullable', 'integer', 'min:4', 'max:100'],
            'current_level' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'lost_reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
