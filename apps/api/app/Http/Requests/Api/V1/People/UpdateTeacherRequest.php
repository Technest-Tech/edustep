<?php

namespace App\Http\Requests\Api\V1\People;

use App\Enums\TeacherRateType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateTeacherRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('teacher')),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
            'employment_type' => ['sometimes', 'required', Rule::in(['full_time', 'part_time'])],
            'specialization' => ['sometimes', 'nullable', 'string', 'max:255'],
            'availability' => ['sometimes', 'nullable', 'array', 'max:7'],
            'availability.*' => [
                'required',
                'distinct',
                Rule::in([
                    'saturday',
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                ]),
            ],
            'bio' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'rate_type' => ['sometimes', 'required_with:rate_amount', Rule::enum(TeacherRateType::class)],
            'rate_amount' => ['sometimes', 'required_with:rate_type', 'numeric', 'min:0', 'max:1000000'],
            'password' => [
                'sometimes',
                'nullable',
                'confirmed',
                Password::min(10)->letters()->mixedCase()->numbers(),
            ],
        ];
    }
}
