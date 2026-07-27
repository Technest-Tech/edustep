<?php

namespace App\Models;

use App\Enums\ProgressRating;
use App\Enums\ProgressReportStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_id',
    'enrollment_id',
    'level_id',
    'created_by',
    'published_by',
    'period_label',
    'period_starts_on',
    'period_ends_on',
    'status',
    'overall_score',
    'overall_rating',
    'attendance_rate',
    'summary',
    'strengths',
    'areas_for_improvement',
    'next_steps',
    'published_at',
])]
class StudentProgressReport extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => ProgressReportStatus::class,
            'overall_rating' => ProgressRating::class,
            'overall_score' => 'decimal:2',
            'attendance_rate' => 'decimal:2',
            'period_starts_on' => 'date',
            'period_ends_on' => 'date',
            'published_at' => 'datetime',
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

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
