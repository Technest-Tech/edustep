<?php

namespace App\Http\Resources\Api\V1\Management;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'category' => $this->category,
            'description' => $this->description,
            'method' => $this->method,
            'route_name' => $this->route_name,
            'request_id' => $this->request_id,
            'ip_address' => $this->ip_address,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'changed_fields' => $this->changed_fields ?? [],
            'metadata' => $this->metadata,
            'actor' => $this->whenLoaded('actor', fn () => $this->actor ? [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'role' => $this->actor->role,
            ] : null),
            'auditable' => $this->auditable_type ? [
                'type' => class_basename($this->auditable_type),
                'id' => $this->auditable_id,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
