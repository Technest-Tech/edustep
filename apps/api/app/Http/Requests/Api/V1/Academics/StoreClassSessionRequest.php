<?php

namespace App\Http\Requests\Api\V1\Academics;

use App\Enums\ClassSessionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassSessionRequest extends FormRequest
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
                'nullable',
                'ulid',
                Rule::exists('users', 'id')->where('role', 'teacher')->where('status', 'active'),
            ],
            'title' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(ClassSessionStatus::class)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'meeting_url' => ['nullable', 'url', 'max:255'],
            'room_name' => ['nullable', 'string', 'max:255'],
            'lesson_focus' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
