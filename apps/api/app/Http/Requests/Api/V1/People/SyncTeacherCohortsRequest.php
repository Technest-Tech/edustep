<?php

namespace App\Http\Requests\Api\V1\People;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeacherCohortsRequest extends FormRequest
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
            'cohort_ids' => ['required', 'array', 'max:100'],
            'cohort_ids.*' => [
                'required',
                'distinct',
                'ulid',
                Rule::exists('cohorts', 'id')
                    ->whereNull('deleted_at')
                    ->whereIn('status', ['planned', 'enrolling', 'active']),
            ],
            'update_future_sessions' => ['sometimes', 'boolean'],
        ];
    }
}
