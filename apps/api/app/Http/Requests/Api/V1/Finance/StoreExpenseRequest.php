<?php

namespace App\Http\Requests\Api\V1\Finance;

use App\Enums\ExpenseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
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
            'category' => ['required', 'string', 'max:80'],
            'vendor_name' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:10000000'],
            'status' => ['sometimes', Rule::in([
                ExpenseStatus::Draft->value,
                ExpenseStatus::Submitted->value,
            ])],
            'incurred_on' => ['required', 'date', 'before_or_equal:today'],
            'due_on' => ['nullable', 'date', 'after_or_equal:incurred_on'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
