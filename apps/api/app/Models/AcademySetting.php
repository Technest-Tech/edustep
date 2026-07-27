<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'academy_name',
    'academy_name_en',
    'phone',
    'whatsapp_phone',
    'email',
    'website',
    'address',
    'timezone',
    'locale',
    'currency',
    'invoice_prefix',
    'student_code_prefix',
    'offer_validity_days',
    'seat_hold_hours',
    'working_days',
    'business_hours',
    'updated_by',
])]
class AcademySetting extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
            'business_hours' => 'array',
        ];
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
