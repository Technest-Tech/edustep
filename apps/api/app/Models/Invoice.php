<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'student_id',
    'enrollment_id',
    'invoice_number',
    'status',
    'issued_on',
    'due_on',
    'subtotal',
    'discount_amount',
    'total_amount',
    'notes',
])]
class Invoice extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'issued_on' => 'date',
            'due_on' => 'date',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
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

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function subscriptionInstallment(): HasOne
    {
        return $this->hasOne(SubscriptionInstallment::class);
    }

    public function getPaidAmountAttribute(): string
    {
        return number_format((float) ($this->payments_sum_amount ?? $this->payments->sum('amount')), 2, '.', '');
    }

    public function getBalanceAttribute(): string
    {
        return number_format(max(0, (float) $this->total_amount - (float) $this->paid_amount), 2, '.', '');
    }
}
