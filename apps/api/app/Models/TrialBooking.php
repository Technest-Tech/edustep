<?php

namespace App\Models;

use App\Enums\TrialBookingStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'cohort_id',
    'class_session_id',
    'created_by',
    'status',
    'scheduled_at',
    'duration_minutes',
    'meeting_url',
    'room_name',
    'notes',
    'confirmed_at',
    'attended_at',
])]
class TrialBooking extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => TrialBookingStatus::class,
            'scheduled_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'attended_at' => 'datetime',
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

    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
