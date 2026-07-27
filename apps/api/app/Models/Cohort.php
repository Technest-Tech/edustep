<?php

namespace App\Models;

use App\Enums\CohortStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'program_id',
    'level_id',
    'teacher_id',
    'code',
    'name',
    'status',
    'delivery_mode',
    'capacity',
    'fee',
    'starts_on',
    'ends_on',
    'schedule',
    'timezone',
    'meeting_url',
    'room_name',
])]
class Cohort extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => CohortStatus::class,
            'fee' => 'decimal:2',
            'starts_on' => 'date',
            'ends_on' => 'date',
            'schedule' => 'array',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    public function enrollmentOffers(): HasMany
    {
        return $this->hasMany(EnrollmentOffer::class);
    }

    public function trialBookings(): HasMany
    {
        return $this->hasMany(TrialBooking::class);
    }

    public function seatReservations(): HasMany
    {
        return $this->hasMany(SeatReservation::class);
    }

    public function waitlistEntries(): HasMany
    {
        return $this->hasMany(WaitlistEntry::class);
    }
}
