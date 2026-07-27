<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'job_title' => $this->job_title,
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'role' => $this->role,
            'status' => $this->status,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'two_factor_enabled' => filled($this->two_factor_confirmed_at),
            'requires_two_factor_setup' => config('security.require_privileged_two_factor')
                && in_array($this->role, config('security.privileged_roles'), true)
                && blank($this->two_factor_confirmed_at),
            'must_change_password' => (bool) $this->must_change_password,
            'password_changed_at' => $this->password_changed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
