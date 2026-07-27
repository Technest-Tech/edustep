<?php

namespace App\Models;

use App\Enums\AcademicRiskStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'student_id',
    'enrollment_id',
    'assigned_to',
    'type',
    'severity',
    'status',
    'title',
    'description',
    'is_automatic',
    'detected_at',
    'resolved_at',
    'metadata',
])]
class AcademicRisk extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => AcademicRiskStatus::class,
            'is_automatic' => 'boolean',
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
            'metadata' => 'array',
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

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(AcademicIntervention::class);
    }
}
