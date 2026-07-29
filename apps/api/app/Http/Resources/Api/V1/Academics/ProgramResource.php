<?php

namespace App\Http\Resources\Api\V1\Academics;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
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
            'description' => $this->description,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'catalog_version' => $this->catalog_version,
            'sessions_per_week' => $this->sessions_per_week,
            'default_duration_weeks' => $this->default_duration_weeks,
            'default_sessions_count' => $this->default_sessions_count,
            'session_duration_minutes' => $this->session_duration_minutes,
            'home_practice_minutes_min' => $this->home_practice_minutes_min,
            'home_practice_minutes_max' => $this->home_practice_minutes_max,
            'minimum_group_size' => $this->minimum_group_size,
            'maximum_group_size' => $this->maximum_group_size,
            'launch_price' => $this->launch_price,
            'standard_price' => $this->standard_price,
            'one_to_one_price' => $this->one_to_one_price,
            'full_payment_discount_percent' => $this->full_payment_discount_percent,
            'promotion_score_percent' => $this->promotion_score_percent,
            'promotion_attendance_percent' => $this->promotion_attendance_percent,
            'is_active' => $this->is_active,
            'levels' => LevelResource::collection($this->whenLoaded('levels')),
        ];
    }
}
