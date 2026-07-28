<?php

namespace App\Http\Requests\Api\V1\People;

use App\Enums\TeacherRateType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreTeacherRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time'])],
            'specialization' => ['nullable', 'string', 'max:255'],
            'availability' => ['nullable', 'array', 'max:7'],
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
            'bio' => ['nullable', 'string', 'max:5000'],
            'rate_type' => ['required', Rule::enum(TeacherRateType::class)],
            'rate_amount' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'password' => [
                'required',
                'confirmed',
                Password::min(10)->letters()->mixedCase()->numbers(),
            ],
        ];
    }
}
