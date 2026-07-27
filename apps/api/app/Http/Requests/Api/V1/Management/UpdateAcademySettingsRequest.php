<?php

namespace App\Http\Requests\Api\V1\Management;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademySettingsRequest extends FormRequest
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
            'academy_name' => ['required', 'string', 'max:150'],
            'academy_name_en' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'whatsapp_phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'timezone' => ['required', 'timezone'],
            'locale' => ['required', Rule::in(['ar', 'en'])],
            'currency' => ['required', Rule::in(['EGP', 'USD', 'SAR', 'AED'])],
            'invoice_prefix' => ['required', 'alpha_num:ascii', 'max:20'],
            'student_code_prefix' => ['required', 'alpha_num:ascii', 'max:20'],
            'offer_validity_days' => ['required', 'integer', 'min:1', 'max:90'],
            'seat_hold_hours' => ['required', 'integer', 'min:1', 'max:336'],
            'working_days' => ['required', 'array', 'min:1'],
            'working_days.*' => [
                'required',
                'string',
                'distinct',
                Rule::in(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            ],
            'business_hours' => ['required', 'array'],
            'business_hours.start' => ['required', 'date_format:H:i'],
            'business_hours.end' => ['required', 'date_format:H:i', 'after:business_hours.start'],
        ];
    }
}
