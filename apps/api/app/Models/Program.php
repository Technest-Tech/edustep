<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code',
    'name_ar',
    'name_en',
    'description',
    'age_min',
    'age_max',
    'catalog_version',
    'sessions_per_week',
    'default_duration_weeks',
    'default_sessions_count',
    'session_duration_minutes',
    'home_practice_minutes_min',
    'home_practice_minutes_max',
    'minimum_group_size',
    'maximum_group_size',
    'launch_price',
    'standard_price',
    'one_to_one_price',
    'full_payment_discount_percent',
    'promotion_score_percent',
    'promotion_attendance_percent',
    'is_active',
])]
class Program extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'launch_price' => 'decimal:2',
            'standard_price' => 'decimal:2',
            'one_to_one_price' => 'decimal:2',
            'full_payment_discount_percent' => 'decimal:2',
            'promotion_score_percent' => 'decimal:2',
            'promotion_attendance_percent' => 'decimal:2',
        ];
    }

    public function levels(): HasMany
    {
        return $this->hasMany(Level::class)->orderBy('sort_order');
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
