<?php

namespace App\Http\Requests\Api\V1\Communication;

use App\Enums\MessageChannel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
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
            'guardian_id' => ['nullable', 'ulid', 'exists:guardian_profiles,id', 'required_without:student_id'],
            'student_id' => ['nullable', 'ulid', 'exists:students,id', 'required_without:guardian_id'],
            'message_template_id' => ['nullable', 'ulid', 'exists:message_templates,id'],
            'channel' => ['nullable', Rule::enum(MessageChannel::class)],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:5000', 'required_without:message_template_id'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
