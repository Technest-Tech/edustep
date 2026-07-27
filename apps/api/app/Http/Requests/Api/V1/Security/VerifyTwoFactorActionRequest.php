<?php

namespace App\Http\Requests\Api\V1\Security;

use Illuminate\Foundation\Http\FormRequest;

class VerifyTwoFactorActionRequest extends FormRequest
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
            'current_password' => ['required', 'string', 'current_password:web'],
            'code' => ['required', 'string', 'max:50'],
        ];
    }
}
