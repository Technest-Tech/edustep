<?php

namespace App\Http\Resources\Api\V1\CRM;

use App\Http\Resources\Api\V1\Admissions\EnrollmentOfferResource;
use App\Http\Resources\Api\V1\Admissions\SeatReservationResource;
use App\Http\Resources\Api\V1\Admissions\TrialBookingResource;
use App\Http\Resources\Api\V1\Admissions\WaitlistEntryResource;
use App\Http\Resources\Api\V1\Students\StudentResource;
use Illuminate\Http\Request;

class LeadResource extends LeadListResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'preferred_contact_channel' => $this->preferred_contact_channel,
            'current_level' => $this->current_level,
            'notes' => $this->notes,
            'lost_reason' => $this->lost_reason,
            'converted_at' => $this->converted_at?->toIso8601String(),
            'activities' => LeadActivityResource::collection($this->whenLoaded('activities')),
            'follow_ups' => FollowUpResource::collection($this->whenLoaded('followUps')),
            'placement_assessment' => $this->whenLoaded(
                'placementAssessment',
                fn () => $this->placementAssessment
                    ? new PlacementAssessmentResource($this->placementAssessment)
                    : null,
            ),
            'enrollment_offers' => EnrollmentOfferResource::collection(
                $this->whenLoaded('enrollmentOffers'),
            ),
            'trial_bookings' => TrialBookingResource::collection(
                $this->whenLoaded('trialBookings'),
            ),
            'seat_reservations' => SeatReservationResource::collection(
                $this->whenLoaded('seatReservations'),
            ),
            'waitlist_entries' => WaitlistEntryResource::collection(
                $this->whenLoaded('waitlistEntries'),
            ),
            'student' => $this->whenLoaded(
                'student',
                fn () => $this->student ? new StudentResource($this->student) : null,
            ),
        ];
    }
}
