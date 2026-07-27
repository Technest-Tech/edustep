<?php

namespace App\Modules\Admissions\Actions;

use App\Enums\EnrollmentStatus;
use App\Enums\SeatReservationStatus;
use App\Models\Cohort;

class CohortSeatAvailability
{
    /**
     * @return array{capacity: int, enrolled: int, held: int, available: int}
     */
    public function for(Cohort $cohort, ?string $excludingLeadId = null): array
    {
        $cohort->seatReservations()
            ->where('status', SeatReservationStatus::Held)
            ->where('reserved_until', '<=', now())
            ->update([
                'status' => SeatReservationStatus::Expired,
                'released_at' => now(),
                'release_reason' => 'انتهت مدة حجز المقعد تلقائيًا.',
            ]);

        $enrolled = $cohort->enrollments()
            ->where('status', EnrollmentStatus::Active)
            ->count();
        $held = $cohort->seatReservations()
            ->where('status', SeatReservationStatus::Held)
            ->where('reserved_until', '>', now())
            ->when($excludingLeadId, fn ($query) => $query->where('lead_id', '!=', $excludingLeadId))
            ->count();

        return [
            'capacity' => $cohort->capacity,
            'enrolled' => $enrolled,
            'held' => $held,
            'available' => max(0, $cohort->capacity - $enrolled - $held),
        ];
    }
}
