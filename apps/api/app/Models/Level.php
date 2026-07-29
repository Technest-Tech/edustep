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
    'curriculum_stage_id',
    'code',
    'name_ar',
    'name_en',
    'cefr_reference',
    'entry_rule',
    'outcome',
    'sessions_count',
    'duration_weeks',
    'sessions_per_week',
    'session_duration_minutes',
    'guided_hours',
    'launch_price',
    'standard_price',
    'one_to_one_price',
    'minimum_group_size',
    'maximum_group_size',
    'default_installments',
    'is_optional',
    'catalog_version',
    'sort_order',
    'is_active',
])]
class Level extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_optional' => 'boolean',
            'guided_hours' => 'decimal:1',
            'launch_price' => 'decimal:2',
            'standard_price' => 'decimal:2',
            'one_to_one_price' => 'decimal:2',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculumStage(): BelongsTo
    {
        return $this->belongsTo(CurriculumStage::class);
    }

    public function cohorts(): HasMany
    {
        return $this->hasMany(Cohort::class);
    }

    public function studyPackages(): HasMany
    {
        return $this->hasMany(StudyPackage::class);
    }
}
