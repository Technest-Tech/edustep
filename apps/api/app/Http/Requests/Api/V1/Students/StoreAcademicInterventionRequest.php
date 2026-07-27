<?php

namespace App\Http\Requests\Api\V1\Students;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcademicInterventionRequest extends FormRequest
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
            'owner_id' => ['nullable', 'ulid', 'exists:users,id'],
            'type' => ['required', Rule::in(['parent_call', 'extra_session', 'practice_plan', 'teacher_follow_up', 'counseling', 'other'])],
            'title' => ['required', 'string', 'max:255'],
            'plan' => ['required', 'string', 'max:5000'],
            'due_on' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
