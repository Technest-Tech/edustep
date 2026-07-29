<?php

namespace App\Models;

use App\Enums\ClassSessionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'cohort_id',
    'teacher_id',
    'session_number',
    'cycle_phase',
    'title',
    'status',
    'starts_at',
    'ends_at',
    'meeting_url',
    'room_name',
    'lesson_focus',
    'teacher_notes',
    'completed_at',
])]
class ClassSession extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => ClassSessionStatus::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function teacherEarning(): HasOne
    {
        return $this->hasOne(TeacherEarning::class);
    }
}
