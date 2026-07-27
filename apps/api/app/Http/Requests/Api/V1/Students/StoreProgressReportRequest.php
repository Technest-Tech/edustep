<?php

namespace App\Http\Requests\Api\V1\Students;

use App\Enums\ProgressRating;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgressReportRequest extends FormRequest
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
            'level_id' => ['nullable', 'ulid', 'exists:levels,id'],
            'period_label' => ['required', 'string', 'max:150'],
            'period_starts_on' => ['required', 'date'],
            'period_ends_on' => ['required', 'date', 'after_or_equal:period_starts_on'],
            'overall_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'overall_rating' => ['required', Rule::enum(ProgressRating::class)],
            'attendance_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'summary' => ['required', 'string', 'max:5000'],
            'strengths' => ['nullable', 'string', 'max:5000'],
            'areas_for_improvement' => ['nullable', 'string', 'max:5000'],
            'next_steps' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
