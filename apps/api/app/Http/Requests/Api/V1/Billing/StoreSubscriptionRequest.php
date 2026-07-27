<?php

namespace App\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionRequest extends FormRequest
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
            'student_id' => ['required', 'ulid', 'exists:students,id'],
            'enrollment_id' => [
                'required',
                'ulid',
                Rule::exists('enrollments', 'id')->where('student_id', $this->input('student_id')),
            ],
            'study_package_id' => ['required', 'ulid', 'exists:study_packages,id'],
            'starts_on' => ['required', 'date'],
            'installment_count' => ['nullable', 'integer', 'min:1', 'max:12'],
            'discount_amount' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
