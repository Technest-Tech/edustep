<?php

namespace App\Models;

use App\Enums\TeacherRateType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'teacher_id',
    'program_id',
    'rate_type',
    'amount',
    'effective_from',
    'effective_to',
    'is_active',
    'notes',
])]
class TeacherRateRule extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'rate_type' => TeacherRateType::class,
            'amount' => 'decimal:2',
            'effective_from' => 'date',
            'effective_to' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(TeacherEarning::class);
    }
}
