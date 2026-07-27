<?php

namespace App\Models;

use App\Enums\EnrollmentOfferStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'lead_id',
    'cohort_id',
    'created_by',
    'approved_by',
    'offer_number',
    'status',
    'price_amount',
    'discount_amount',
    'net_amount',
    'valid_until',
    'notes',
    'sent_at',
    'accepted_at',
    'declined_at',
])]
class EnrollmentOffer extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => EnrollmentOfferStatus::class,
            'price_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'valid_until' => 'date',
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
            'declined_at' => 'datetime',
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

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function seatReservation(): HasOne
    {
        return $this->hasOne(SeatReservation::class);
    }
}
