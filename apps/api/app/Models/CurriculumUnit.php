<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'curriculum_stage_id',
    'unit_number',
    'theme',
    'can_do_outcome',
    'target_language',
    'lexis',
    'pronunciation_focus',
    'performance_task',
    'unit_check',
])]
class CurriculumUnit extends Model
{
    use HasUlids;

    public function stage(): BelongsTo
    {
        return $this->belongsTo(CurriculumStage::class, 'curriculum_stage_id');
    }
}
