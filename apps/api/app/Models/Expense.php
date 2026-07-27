<?php

namespace App\Models;

use App\Enums\ExpenseStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'expense_number',
    'category',
    'vendor_name',
    'description',
    'amount',
    'status',
    'incurred_on',
    'due_on',
    'payment_method',
    'paid_at',
    'created_by',
    'approved_by',
    'approved_at',
    'notes',
])]
class Expense extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => ExpenseStatus::class,
            'amount' => 'decimal:2',
            'incurred_on' => 'date',
            'due_on' => 'date',
            'paid_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
