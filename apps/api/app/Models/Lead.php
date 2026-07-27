<?php

namespace App\Models;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'owner_id',
    'interested_program_id',
    'full_name',
    'phone',
    'whatsapp_phone',
    'email',
    'source',
    'status',
    'preferred_contact_channel',
    'preferred_schedule',
    'learner_age',
    'current_level',
    'notes',
    'last_contacted_at',
    'converted_at',
    'lost_at',
    'lost_reason',
])]
class Lead extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'source' => LeadSource::class,
            'status' => LeadStatus::class,
            'last_contacted_at' => 'datetime',
            'converted_at' => 'datetime',
            'lost_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function interestedProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'interested_program_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest('occurred_at');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class)->orderBy('due_at');
    }

    public function placementAssessment(): HasOne
    {
        return $this->hasOne(PlacementAssessment::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function enrollmentOffers(): HasMany
    {
        return $this->hasMany(EnrollmentOffer::class)->latest();
    }

    public function trialBookings(): HasMany
    {
        return $this->hasMany(TrialBooking::class)->latest('scheduled_at');
    }

    public function seatReservations(): HasMany
    {
        return $this->hasMany(SeatReservation::class)->latest();
    }

    public function waitlistEntries(): HasMany
    {
        return $this->hasMany(WaitlistEntry::class)->latest('joined_at');
    }
}
