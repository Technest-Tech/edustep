<?php

namespace App\Modules\Admissions\Actions;

use App\Enums\SeatReservationStatus;
use App\Enums\WaitlistStatus;
use App\Models\Cohort;
use App\Models\EnrollmentOffer;
use App\Models\Lead;
use App\Models\SeatReservation;
use App\Models\User;
use App\Models\WaitlistEntry;
use Illuminate\Support\Facades\DB;

class ReserveSeatOrWaitlist
{
    public function __construct(
        private readonly CohortSeatAvailability $seatAvailability,
    ) {}

    /**
     * @return array{mode: 'reservation'|'waitlist', item: SeatReservation|WaitlistEntry}
     */
    public function execute(
        Lead $lead,
        Cohort $cohort,
        User $actor,
        ?EnrollmentOffer $offer = null,
        int $holdHours = 48,
        ?string $notes = null,
    ): array {
        return DB::transaction(function () use (
            $lead,
            $cohort,
            $actor,
            $offer,
            $holdHours,
            $notes,
        ): array {
            $cohort = Cohort::query()->lockForUpdate()->findOrFail($cohort->id);
            $existingReservation = SeatReservation::query()
                ->where('lead_id', $lead->id)
                ->where('cohort_id', $cohort->id)
                ->where('status', SeatReservationStatus::Held)
                ->where('reserved_until', '>', now())
                ->first();

            if ($existingReservation) {
                if ($offer && ! $existingReservation->enrollment_offer_id) {
                    $existingReservation->update(['enrollment_offer_id' => $offer->id]);
                }

                return ['mode' => 'reservation', 'item' => $existingReservation->fresh()];
            }

            if ($this->seatAvailability->for($cohort, $lead->id)['available'] > 0) {
                $reservation = SeatReservation::query()->create([
                    'lead_id' => $lead->id,
                    'cohort_id' => $cohort->id,
                    'enrollment_offer_id' => $offer?->id,
                    'reserved_by' => $actor->id,
                    'status' => SeatReservationStatus::Held,
                    'reserved_until' => now()->addHours($holdHours),
                ]);

                WaitlistEntry::query()
                    ->where('lead_id', $lead->id)
                    ->where('cohort_id', $cohort->id)
                    ->whereIn('status', [WaitlistStatus::Waiting, WaitlistStatus::Offered])
                    ->update([
                        'status' => WaitlistStatus::Offered,
                        'offered_until' => $reservation->reserved_until,
                    ]);

                return ['mode' => 'reservation', 'item' => $reservation];
            }

            $waitlist = WaitlistEntry::query()->updateOrCreate(
                [
                    'lead_id' => $lead->id,
                    'cohort_id' => $cohort->id,
                ],
                [
                    'created_by' => $actor->id,
                    'status' => WaitlistStatus::Waiting,
                    'priority' => ((int) WaitlistEntry::query()
                        ->where('cohort_id', $cohort->id)
                        ->where('status', WaitlistStatus::Waiting)
                        ->max('priority')) + 10,
                    'joined_at' => now(),
                    'offered_until' => null,
                    'notes' => $notes,
                ],
            );

            return ['mode' => 'waitlist', 'item' => $waitlist];
        });
    }
}
