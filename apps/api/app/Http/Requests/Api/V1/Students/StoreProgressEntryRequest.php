<?php

namespace App\Http\Requests\Api\V1\Students;

use App\Enums\ProgressRating;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgressEntryRequest extends FormRequest
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
            'type' => [
                'required',
                Rule::in(['assessment', 'homework', 'speaking', 'writing', 'reading', 'listening', 'general']),
            ],
            'title' => ['required', 'string', 'max:255'],
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rating' => ['required', Rule::enum(ProgressRating::class)],
            'feedback' => ['nullable', 'string', 'max:5000'],
            'occurred_on' => ['required', 'date', 'before_or_equal:today'],
        ];
    }
}
