<?php

namespace App\Models;

use App\Enums\WaitlistStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'cohort_id',
    'created_by',
    'status',
    'priority',
    'joined_at',
    'offered_until',
    'notes',
])]
class WaitlistEntry extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => WaitlistStatus::class,
            'joined_at' => 'datetime',
            'offered_until' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
