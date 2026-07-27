<?php

namespace App\Models;

use App\Enums\ProgressRating;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_id',
    'enrollment_id',
    'level_id',
    'evaluator_id',
    'type',
    'title',
    'score',
    'rating',
    'feedback',
    'occurred_on',
])]
class ProgressEntry extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'rating' => ProgressRating::class,
            'occurred_on' => 'date',
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

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }
}
