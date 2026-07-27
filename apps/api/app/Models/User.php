<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetAccountPassword;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'phone',
    'job_title',
    'password',
    'locale',
    'timezone',
    'role',
    'status',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUlids, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_last_used_step' => 'integer',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function guardianProfile(): HasOne
    {
        return $this->hasOne(GuardianProfile::class);
    }

    public function teachingCohorts(): HasMany
    {
        return $this->hasMany(Cohort::class, 'teacher_id');
    }

    public function teachingSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class, 'teacher_id');
    }

    public function teacherRateRules(): HasMany
    {
        return $this->hasMany(TeacherRateRule::class, 'teacher_id');
    }

    public function teacherEarnings(): HasMany
    {
        return $this->hasMany(TeacherEarning::class, 'teacher_id');
    }

    public function createdSubscriptions(): HasMany
    {
        return $this->hasMany(StudentSubscription::class, 'created_by');
    }

    public function assignedAcademicRisks(): HasMany
    {
        return $this->hasMany(AcademicRisk::class, 'assigned_to');
    }

    public function ownedAcademicInterventions(): HasMany
    {
        return $this->hasMany(AcademicIntervention::class, 'owner_id');
    }

    public function assignedServiceRequests(): HasMany
    {
        return $this->hasMany(FamilyServiceRequest::class, 'assigned_to');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetAccountPassword($token));
    }
}
