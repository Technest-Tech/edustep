<?php

namespace App\Http\Resources\Api\V1\CRM;

use App\Enums\FollowUpStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowUpResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $overdue = $this->status === FollowUpStatus::Pending && $this->due_at?->isPast();

        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'notes' => $this->notes,
            'priority' => $this->priority->value,
            'status' => $this->status->value,
            'is_overdue' => $overdue,
            'due_at' => $this->due_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'assignee' => $this->whenLoaded('assignee', fn () => [
                'id' => $this->assignee?->id,
                'name' => $this->assignee?->name,
            ]),
            'lead' => $this->whenLoaded('lead', fn () => [
                'id' => $this->lead->id,
                'full_name' => $this->lead->full_name,
                'phone' => $this->lead->phone,
            ]),
        ];
    }
}
