<?php

namespace App\Http\Requests\Api\V1\Students;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcademicRiskRequest extends FormRequest
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
        $student = $this->route('student');

        return [
            'enrollment_id' => [
                'nullable',
                'ulid',
                Rule::exists('enrollments', 'id')->where('student_id', $student->id),
            ],
            'assigned_to' => ['nullable', 'ulid', 'exists:users,id'],
            'type' => ['required', Rule::in(['attendance', 'performance', 'engagement', 'homework', 'behavior', 'other'])],
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
