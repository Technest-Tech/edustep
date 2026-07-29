<?php

namespace App\Http\Requests\Api\V1\Academics;

use App\Enums\CohortStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCohortRequest extends FormRequest
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
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'level_id' => [
                'required',
                'ulid',
                Rule::exists('levels', 'id')->where('program_id', $this->string('program_id')->toString()),
            ],
            'study_package_id' => [
                'nullable',
                'ulid',
                Rule::exists('study_packages', 'id')
                    ->where('program_id', $this->string('program_id')->toString())
                    ->where('level_id', $this->string('level_id')->toString())
                    ->where('is_active', true),
            ],
            'teacher_id' => [
                'nullable',
                'ulid',
                Rule::exists('users', 'id')->where('role', 'teacher')->where('status', 'active'),
            ],
            'code' => ['required', 'string', 'max:30', 'unique:cohorts,code'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::enum(CohortStatus::class)],
            'delivery_mode' => ['required', Rule::in(['online', 'onsite', 'hybrid'])],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:100'],
            'fee' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'schedule' => ['nullable', 'array', 'max:7'],
            'schedule.*.day' => [
                'required',
                Rule::in(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            ],
            'schedule.*.time' => ['required', 'date_format:H:i'],
            'meeting_url' => ['nullable', 'url', 'max:255'],
            'room_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
