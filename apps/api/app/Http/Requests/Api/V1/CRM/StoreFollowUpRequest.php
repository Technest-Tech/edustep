<?php

namespace App\Http\Requests\Api\V1\CRM;

use App\Enums\FollowUpPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowUpRequest extends FormRequest
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
            'subject' => ['required', 'string', 'max:180'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(FollowUpPriority::class)],
            'due_at' => ['required', 'date'],
            'assigned_to' => ['nullable', 'ulid', 'exists:users,id'],
        ];
    }
}
