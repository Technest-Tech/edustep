<?php

namespace App\Models;

use App\Enums\FollowUpPriority;
use App\Enums\FollowUpStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'assigned_to',
    'subject',
    'notes',
    'priority',
    'status',
    'due_at',
    'completed_at',
])]
class FollowUp extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'priority' => FollowUpPriority::class,
            'status' => FollowUpStatus::class,
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
