<?php

namespace App\Http\Resources\Api\V1\Academics;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumUnitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'unit_number' => $this->unit_number,
            'theme' => $this->theme,
            'can_do_outcome' => $this->can_do_outcome,
            'target_language' => $this->target_language,
            'lexis' => $this->lexis,
            'pronunciation_focus' => $this->pronunciation_focus,
            'performance_task' => $this->performance_task,
            'unit_check' => $this->unit_check,
        ];
    }
}
