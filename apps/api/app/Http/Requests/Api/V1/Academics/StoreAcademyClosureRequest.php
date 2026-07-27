<?php

namespace App\Http\Requests\Api\V1\Academics;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademyClosureRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'affects_online' => ['sometimes', 'boolean'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
