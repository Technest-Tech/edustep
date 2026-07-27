<?php

namespace App\Http\Requests\Api\V1\CRM;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadActivityRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:contact,note,status_change,email,meeting'],
            'channel' => ['nullable', 'string', 'in:whatsapp,phone,email,in_person,system'],
            'direction' => ['nullable', 'string', 'in:inbound,outbound,internal'],
            'title' => ['required', 'string', 'max:180'],
            'details' => ['nullable', 'string', 'max:5000'],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
