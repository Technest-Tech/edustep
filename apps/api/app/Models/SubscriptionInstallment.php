<?php

namespace App\Models;

use App\Enums\InstallmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_subscription_id',
    'invoice_id',
    'installment_number',
    'amount',
    'due_on',
    'status',
    'paid_at',
])]
class SubscriptionInstallment extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_on' => 'date',
            'status' => InstallmentStatus::class,
            'paid_at' => 'datetime',
        ];
    }

    public function studentSubscription(): BelongsTo
    {
        return $this->belongsTo(StudentSubscription::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
