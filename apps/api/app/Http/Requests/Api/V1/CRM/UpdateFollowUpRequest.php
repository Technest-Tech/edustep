<?php

namespace App\Http\Requests\Api\V1\CRM;

use App\Enums\FollowUpPriority;
use App\Enums\FollowUpStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFollowUpRequest extends FormRequest
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
            'subject' => ['sometimes', 'string', 'max:180'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(FollowUpPriority::class)],
            'status' => ['sometimes', Rule::enum(FollowUpStatus::class)],
            'due_at' => ['sometimes', 'date'],
            'assigned_to' => ['nullable', 'ulid', 'exists:users,id'],
        ];
    }
}
