<?php

namespace App\Http\Requests\Api\V1\Academics;

use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordAttendanceRequest extends FormRequest
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
        $session = $this->route('classSession');

        return [
            'records' => ['required', 'array', 'min:1', 'max:100'],
            'records.*.student_id' => [
                'required',
                'ulid',
                'distinct',
                Rule::exists('enrollments', 'student_id')
                    ->where('cohort_id', $session->cohort_id)
                    ->where('status', 'active'),
            ],
            'records.*.status' => ['required', Rule::enum(AttendanceStatus::class)],
            'records.*.notes' => ['nullable', 'string', 'max:1000'],
            'complete_session' => ['sometimes', 'boolean'],
            'teacher_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
