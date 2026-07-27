<?php

namespace App\Http\Resources\Api\V1\Management;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;

class TeamMemberResource extends UserResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'account_type' => in_array($this->role, ['teacher', 'guardian'], true)
                ? 'portal'
                : 'staff',
            'teaching_cohorts_count' => $this->whenCounted('teachingCohorts'),
            'audit_events_count' => $this->whenCounted('auditLogs'),
        ];
    }
}
