<?php

namespace App\Models;

use App\Enums\StudentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'lead_id',
    'student_code',
    'full_name',
    'phone',
    'email',
    'date_of_birth',
    'guardian_name',
    'guardian_phone',
    'status',
    'joined_on',
    'notes',
])]
class Student extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => StudentStatus::class,
            'date_of_birth' => 'date',
            'joined_on' => 'date',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function progressEntries(): HasMany
    {
        return $this->hasMany(ProgressEntry::class);
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(GuardianProfile::class, 'guardian_student', 'student_id', 'guardian_id')
            ->withPivot(['relationship', 'is_primary'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(StudentSubscription::class);
    }

    public function progressReports(): HasMany
    {
        return $this->hasMany(StudentProgressReport::class);
    }

    public function academicRisks(): HasMany
    {
        return $this->hasMany(AcademicRisk::class);
    }

    public function academicInterventions(): HasMany
    {
        return $this->hasMany(AcademicIntervention::class);
    }

    public function familyServiceRequests(): HasMany
    {
        return $this->hasMany(FamilyServiceRequest::class);
    }
}
