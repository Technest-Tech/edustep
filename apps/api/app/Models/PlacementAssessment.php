<?php

namespace App\Models;

use App\Enums\AssessmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'assessed_by',
    'recommended_level_id',
    'status',
    'scheduled_at',
    'completed_at',
    'score',
    'notes',
])]
class PlacementAssessment extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => AssessmentStatus::class,
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'score' => 'decimal:2',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessed_by');
    }

    public function recommendedLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'recommended_level_id');
    }
}
