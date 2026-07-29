<?php

namespace App\Http\Requests\Api\V1\Academics;

use Illuminate\Foundation\Http\FormRequest;

class GenerateCohortScheduleRequest extends FormRequest
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
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'duration_minutes' => ['nullable', 'integer', 'min:30', 'max:240'],
            'title_prefix' => ['nullable', 'string', 'max:120'],
            'lesson_focus' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
