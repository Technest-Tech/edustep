<?php

namespace App\Models;

use App\Enums\SeatReservationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'cohort_id',
    'enrollment_offer_id',
    'reserved_by',
    'status',
    'reserved_until',
    'converted_at',
    'released_at',
    'release_reason',
])]
class SeatReservation extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => SeatReservationStatus::class,
            'reserved_until' => 'datetime',
            'converted_at' => 'datetime',
            'released_at' => 'datetime',
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

    public function offer(): BelongsTo
    {
        return $this->belongsTo(EnrollmentOffer::class, 'enrollment_offer_id');
    }

    public function reserver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reserved_by');
    }
}
