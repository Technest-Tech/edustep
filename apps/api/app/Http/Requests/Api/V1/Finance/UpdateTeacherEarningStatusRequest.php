<?php

namespace App\Http\Requests\Api\V1\Finance;

use App\Enums\TeacherEarningStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherEarningStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in([
                TeacherEarningStatus::Approved->value,
                TeacherEarningStatus::Paid->value,
                TeacherEarningStatus::Void->value,
            ])],
        ];
    }
}
