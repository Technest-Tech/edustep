<?php

namespace App\Http\Resources\Api\V1\Management;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademySettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academy_name' => $this->academy_name,
            'academy_name_en' => $this->academy_name_en,
            'phone' => $this->phone,
            'whatsapp_phone' => $this->whatsapp_phone,
            'email' => $this->email,
            'website' => $this->website,
            'address' => $this->address,
            'timezone' => $this->timezone,
            'locale' => $this->locale,
            'currency' => $this->currency,
            'invoice_prefix' => $this->invoice_prefix,
            'student_code_prefix' => $this->student_code_prefix,
            'offer_validity_days' => $this->offer_validity_days,
            'seat_hold_hours' => $this->seat_hold_hours,
            'working_days' => $this->working_days ?? [],
            'business_hours' => $this->business_hours ?? [
                'start' => '09:00',
                'end' => '21:00',
            ],
            'updater' => $this->whenLoaded('updater', fn () => $this->updater ? [
                'id' => $this->updater->id,
                'name' => $this->updater->name,
            ] : null),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
