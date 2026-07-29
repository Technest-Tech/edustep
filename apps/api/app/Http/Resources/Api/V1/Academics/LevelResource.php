<?php

namespace App\Http\Resources\Api\V1\Academics;

use App\Http\Resources\Api\V1\Billing\StudyPackageResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LevelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'cefr_reference' => $this->cefr_reference,
            'entry_rule' => $this->entry_rule,
            'outcome' => $this->outcome,
            'sessions_count' => $this->sessions_count,
            'duration_weeks' => $this->duration_weeks,
            'sessions_per_week' => $this->sessions_per_week,
            'session_duration_minutes' => $this->session_duration_minutes,
            'guided_hours' => $this->guided_hours,
            'launch_price' => $this->launch_price,
            'standard_price' => $this->standard_price,
            'one_to_one_price' => $this->one_to_one_price,
            'minimum_group_size' => $this->minimum_group_size,
            'maximum_group_size' => $this->maximum_group_size,
            'default_installments' => $this->default_installments,
            'is_optional' => $this->is_optional,
            'catalog_version' => $this->catalog_version,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'curriculum' => $this->whenLoaded('curriculumStage', fn () => $this->curriculumStage ? [
                'id' => $this->curriculumStage->id,
                'code' => $this->curriculumStage->code,
                'audience' => $this->curriculumStage->audience,
                'source_level' => $this->curriculumStage->source_level,
                'cefr_reference' => $this->curriculumStage->cefr_reference,
                'source_version' => $this->curriculumStage->source_version,
                'units' => CurriculumUnitResource::collection(
                    $this->curriculumStage->relationLoaded('units')
                        ? $this->curriculumStage->units
                        : collect(),
                ),
            ] : null),
            'default_package' => $this->whenLoaded(
                'studyPackages',
                fn () => $this->studyPackages->isNotEmpty()
                    ? StudyPackageResource::make($this->studyPackages->first())->resolve($request)
                    : null,
            ),
        ];
    }
}
