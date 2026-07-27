<?php

namespace App\Http\Requests\Api\V1\Finance;

use App\Enums\ExpenseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseStatusRequest extends FormRequest
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
            'status' => ['required', Rule::enum(ExpenseStatus::class)],
            'payment_method' => [
                'nullable',
                Rule::requiredIf($this->string('status')->toString() === ExpenseStatus::Paid->value),
                Rule::in(['cash', 'bank_transfer', 'instapay', 'card', 'wallet']),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
