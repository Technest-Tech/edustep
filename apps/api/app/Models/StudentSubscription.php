<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'student_id',
    'enrollment_id',
    'study_package_id',
    'parent_subscription_id',
    'created_by',
    'status',
    'starts_on',
    'ends_on',
    'renewal_due_on',
    'included_sessions',
    'price_amount',
    'discount_amount',
    'net_amount',
    'frozen_at',
    'frozen_until',
    'cancelled_at',
    'notes',
])]
class StudentSubscription extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
            'renewal_due_on' => 'date',
            'price_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'frozen_at' => 'datetime',
            'frozen_until' => 'date',
            'cancelled_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function studyPackage(): BelongsTo
    {
        return $this->belongsTo(StudyPackage::class);
    }

    public function parentSubscription(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_subscription_id');
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(self::class, 'parent_subscription_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(SubscriptionInstallment::class);
    }
}
