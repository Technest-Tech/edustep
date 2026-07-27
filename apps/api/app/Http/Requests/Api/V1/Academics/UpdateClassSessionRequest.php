<?php

namespace App\Http\Requests\Api\V1\Academics;

use App\Enums\ClassSessionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassSessionRequest extends FormRequest
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
            'teacher_id' => [
                'sometimes',
                'nullable',
                'ulid',
                Rule::exists('users', 'id')->where('role', 'teacher')->where('status', 'active'),
            ],
            'status' => ['sometimes', Rule::enum(ClassSessionStatus::class)],
            'teacher_notes' => ['nullable', 'string', 'max:5000'],
            'lesson_focus' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'meeting_url' => ['nullable', 'url', 'max:255'],
            'room_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
