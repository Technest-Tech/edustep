<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code',
    'audience',
    'source_level',
    'cefr_reference',
    'source_version',
])]
class CurriculumStage extends Model
{
    use HasUlids;

    public function units(): HasMany
    {
        return $this->hasMany(CurriculumUnit::class)->orderBy('unit_number');
    }

    public function levels(): HasMany
    {
        return $this->hasMany(Level::class);
    }
}
