<?php

namespace App\Models;

use App\Enums\InterventionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'academic_risk_id',
    'student_id',
    'owner_id',
    'created_by',
    'type',
    'status',
    'title',
    'plan',
    'due_on',
    'outcome',
    'completed_at',
])]
class AcademicIntervention extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => InterventionStatus::class,
            'due_on' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function risk(): BelongsTo
    {
        return $this->belongsTo(AcademicRisk::class, 'academic_risk_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
