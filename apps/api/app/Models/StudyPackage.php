<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'program_id',
    'level_id',
    'code',
    'name',
    'sessions_count',
    'duration_weeks',
    'price',
    'standard_price',
    'full_payment_discount_percent',
    'default_installments',
    'second_installment_session',
    'second_installment_due_days_before',
    'source_version',
    'is_active',
    'description',
])]
class StudyPackage extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'standard_price' => 'decimal:2',
            'full_payment_discount_percent' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(StudentSubscription::class);
    }
}
