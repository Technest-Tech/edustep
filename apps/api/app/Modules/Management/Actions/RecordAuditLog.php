<?php

namespace App\Modules\Management\Actions;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class RecordAuditLog
{
    /**
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     * @param  array<int, string>|null  $changedFields
     * @param  array<string, mixed>|null  $metadata
     */
    public function handle(
        Request $request,
        string $action,
        string $category,
        string $description,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $changedFields = null,
        ?array $metadata = null,
    ): AuditLog {
        $request->attributes->set('audit_recorded', true);

        return AuditLog::query()->create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'category' => $category,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'description' => $description,
            'method' => $request->method(),
            'route_name' => $request->route()?->getName(),
            'request_id' => $request->attributes->get('request_id'),
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'changed_fields' => $changedFields,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
