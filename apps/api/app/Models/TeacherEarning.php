<?php

namespace App\Models;

use App\Enums\TeacherEarningStatus;
use App\Enums\TeacherRateType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'class_session_id',
    'teacher_id',
    'teacher_rate_rule_id',
    'status',
    'duration_minutes',
    'rate_type',
    'rate_amount',
    'amount',
    'calculation_snapshot',
    'earned_on',
    'approved_at',
    'approved_by',
    'paid_at',
])]
class TeacherEarning extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => TeacherEarningStatus::class,
            'rate_type' => TeacherRateType::class,
            'rate_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'calculation_snapshot' => 'array',
            'earned_on' => 'date',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function rateRule(): BelongsTo
    {
        return $this->belongsTo(TeacherRateRule::class, 'teacher_rate_rule_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
