<?php

namespace App\Modules\CRM\Actions;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\User;

class RecordLeadActivity
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(Lead $lead, array $attributes, ?User $actor = null): LeadActivity
    {
        $activity = $lead->activities()->create([
            ...$attributes,
            'created_by' => $actor?->id,
            'occurred_at' => $attributes['occurred_at'] ?? now(),
        ]);

        if (($attributes['type'] ?? null) === 'contact') {
            $lead->forceFill(['last_contacted_at' => $activity->occurred_at])->save();
        }

        return $activity;
    }
}
