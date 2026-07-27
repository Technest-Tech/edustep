<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'phone',
    'employment_type',
    'specialization',
    'hourly_rate',
    'availability',
    'bio',
])]
class TeacherProfile extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'availability' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
