<?php

namespace App\Http\Requests\Api\V1\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrialBookingRequest extends FormRequest
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
            'cohort_id' => ['required', 'ulid', 'exists:cohorts,id'],
            'class_session_id' => ['nullable', 'ulid', 'exists:class_sessions,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'duration_minutes' => ['nullable', 'integer', 'min:30', 'max:180'],
            'meeting_url' => ['nullable', 'url', 'max:2048'],
            'room_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
