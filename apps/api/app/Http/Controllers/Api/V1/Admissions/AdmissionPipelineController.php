<?php

namespace App\Http\Controllers\Api\V1\Admissions;

use App\Enums\EnrollmentOfferStatus;
use App\Enums\LeadStatus;
use App\Enums\SeatReservationStatus;
use App\Enums\TrialBookingStatus;
use App\Enums\WaitlistStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admissions\AcceptEnrollmentOfferRequest;
use App\Http\Requests\Api\V1\Admissions\StoreEnrollmentOfferRequest;
use App\Http\Requests\Api\V1\Admissions\StoreSeatRequest;
use App\Http\Requests\Api\V1\Admissions\StoreTrialBookingRequest;
use App\Http\Requests\Api\V1\Admissions\UpdateTrialBookingRequest;
use App\Http\Resources\Api\V1\Admissions\EnrollmentOfferResource;
use App\Http\Resources\Api\V1\Admissions\SeatReservationResource;
use App\Http\Resources\Api\V1\Admissions\TrialBookingResource;
use App\Http\Resources\Api\V1\Admissions\WaitlistEntryResource;
use App\Http\Resources\Api\V1\Students\StudentResource;
use App\Models\AcademySetting;
use App\Models\Cohort;
use App\Models\EnrollmentOffer;
use App\Models\Lead;
use App\Models\SeatReservation;
use App\Models\TrialBooking;
use App\Models\WaitlistEntry;
use App\Modules\Admissions\Actions\ConvertLeadToStudent;
use App\Modules\Admissions\Actions\ReserveSeatOrWaitlist;
use App\Modules\CRM\Actions\RecordLeadActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdmissionPipelineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->expireStaleRecords();

        $offers = EnrollmentOffer::query()
            ->with(['lead', 'cohort', 'creator:id,name', 'seatReservation'])
            ->latest()
            ->limit(100)
            ->get();
        $trials = TrialBooking::query()
            ->with(['lead', 'cohort', 'creator:id,name'])
            ->latest('scheduled_at')
            ->limit(100)
            ->get();
        $reservations = SeatReservation::query()
            ->with(['lead', 'cohort', 'reserver:id,name'])
            ->latest()
            ->limit(100)
            ->get();
        $waitlist = WaitlistEntry::query()
            ->with(['lead', 'cohort', 'creator:id,name'])
            ->orderByRaw("case when status = 'waiting' then 0 when status = 'offered' then 1 else 2 end")
            ->orderBy('priority')
            ->orderBy('joined_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'open_offers' => $offers
                        ->whereIn('status', [EnrollmentOfferStatus::Draft, EnrollmentOfferStatus::Sent])
                        ->count(),
                    'offers_value' => number_format(
                        (float) $offers
                            ->whereIn('status', [EnrollmentOfferStatus::Draft, EnrollmentOfferStatus::Sent])
                            ->sum('net_amount'),
                        2,
                        '.',
                        '',
                    ),
                    'upcoming_trials' => $trials
                        ->whereIn('status', [TrialBookingStatus::Scheduled, TrialBookingStatus::Confirmed])
                        ->filter(fn (TrialBooking $trial) => $trial->scheduled_at->isFuture())
                        ->count(),
                    'active_holds' => $reservations->where('status', SeatReservationStatus::Held)->count(),
                    'waiting' => $waitlist->where('status', WaitlistStatus::Waiting)->count(),
                    'accepted_this_month' => EnrollmentOffer::query()
                        ->where('status', EnrollmentOfferStatus::Accepted)
                        ->whereBetween('accepted_at', [now()->startOfMonth(), now()->endOfMonth()])
                        ->count(),
                ],
                'offers' => EnrollmentOfferResource::collection($offers)->resolve($request),
                'trials' => TrialBookingResource::collection($trials)->resolve($request),
                'reservations' => SeatReservationResource::collection($reservations)->resolve($request),
                'waitlist' => WaitlistEntryResource::collection($waitlist)->resolve($request),
            ],
        ]);
    }

    public function storeOffer(
        StoreEnrollmentOfferRequest $request,
        Lead $lead,
        ReserveSeatOrWaitlist $reserveSeat,
        RecordLeadActivity $recordActivity,
    ): EnrollmentOfferResource {
        $this->ensureLeadIsOpen($lead);
        $data = $request->validated();
        $settings = AcademySetting::query()->first();
        $cohort = Cohort::query()
            ->whereIn('status', ['enrolling', 'active'])
            ->findOrFail($data['cohort_id']);
        $sendNow = $request->boolean('send_now');
        $offer = DB::transaction(function () use (
            $request,
            $lead,
            $cohort,
            $data,
            $sendNow,
            $reserveSeat,
            $recordActivity,
            $settings,
        ): EnrollmentOffer {
            $offer = EnrollmentOffer::query()->create([
                'lead_id' => $lead->id,
                'cohort_id' => $cohort->id,
                'created_by' => $request->user()->id,
                'approved_by' => $sendNow ? $request->user()->id : null,
                'offer_number' => 'OFF-'.now()->format('ym').'-'.Str::upper(Str::random(6)),
                'status' => $sendNow ? EnrollmentOfferStatus::Sent : EnrollmentOfferStatus::Draft,
                'price_amount' => $data['price_amount'],
                'discount_amount' => $data['discount_amount'] ?? 0,
                'net_amount' => (float) $data['price_amount'] - (float) ($data['discount_amount'] ?? 0),
                'valid_until' => $data['valid_until']
                    ?? today()->addDays($settings?->offer_validity_days ?? 7),
                'notes' => $data['notes'] ?? null,
                'sent_at' => $sendNow ? now() : null,
            ]);

            if ($request->boolean('hold_seat')) {
                $reserveSeat->execute(
                    $lead,
                    $cohort,
                    $request->user(),
                    $offer,
                    $data['hold_hours'] ?? $settings?->seat_hold_hours ?? 48,
                    $data['notes'] ?? null,
                );
            }

            $recordActivity->handle($lead, [
                'type' => $sendNow ? 'offer_sent' : 'offer_created',
                'channel' => 'system',
                'direction' => 'outbound',
                'title' => $sendNow ? 'تم إرسال عرض التسجيل' : 'تم إنشاء عرض تسجيل',
                'details' => "العرض {$offer->offer_number} لجروب {$cohort->name} بقيمة {$offer->net_amount}.",
                'metadata' => [
                    'offer_id' => $offer->id,
                    'cohort_id' => $cohort->id,
                    'net_amount' => $offer->net_amount,
                ],
            ], $request->user());

            return $offer;
        });

        return new EnrollmentOfferResource($this->loadOffer($offer));
    }

    public function sendOffer(
        Request $request,
        EnrollmentOffer $enrollmentOffer,
        RecordLeadActivity $recordActivity,
    ): EnrollmentOfferResource {
        if ($enrollmentOffer->status !== EnrollmentOfferStatus::Draft) {
            throw ValidationException::withMessages([
                'offer' => ['يمكن إرسال العرض عندما يكون مسودة فقط.'],
            ]);
        }

        if ($enrollmentOffer->valid_until->lt(today())) {
            throw ValidationException::withMessages([
                'valid_until' => ['انتهت صلاحية العرض. أنشئ عرضًا جديدًا بتاريخ صالح.'],
            ]);
        }

        $enrollmentOffer->update([
            'status' => EnrollmentOfferStatus::Sent,
            'approved_by' => $request->user()->id,
            'sent_at' => now(),
        ]);
        $recordActivity->handle($enrollmentOffer->lead, [
            'type' => 'offer_sent',
            'channel' => 'system',
            'direction' => 'outbound',
            'title' => 'تم إرسال عرض التسجيل',
            'details' => "تم إرسال العرض {$enrollmentOffer->offer_number}.",
            'metadata' => ['offer_id' => $enrollmentOffer->id],
        ], $request->user());

        return new EnrollmentOfferResource($this->loadOffer($enrollmentOffer));
    }

    public function acceptOffer(
        AcceptEnrollmentOfferRequest $request,
        EnrollmentOffer $enrollmentOffer,
        ConvertLeadToStudent $convertLead,
    ): StudentResource {
        if ($enrollmentOffer->status !== EnrollmentOfferStatus::Sent) {
            throw ValidationException::withMessages([
                'offer' => ['يجب إرسال العرض أولًا قبل تسجيل قبوله.'],
            ]);
        }

        if ($enrollmentOffer->valid_until->lt(today())) {
            $enrollmentOffer->update(['status' => EnrollmentOfferStatus::Expired]);

            throw ValidationException::withMessages([
                'offer' => ['انتهت صلاحية هذا العرض.'],
            ]);
        }

        $student = DB::transaction(function () use ($request, $enrollmentOffer, $convertLead) {
            $student = $convertLead->handle($enrollmentOffer->lead, [
                ...$request->validated(),
                'cohort_id' => $enrollmentOffer->cohort_id,
                'fee_amount' => $enrollmentOffer->price_amount,
                'discount_amount' => $enrollmentOffer->discount_amount,
                'enrollment_notes' => "تسجيل من العرض {$enrollmentOffer->offer_number}.",
            ], $request->user());

            $enrollmentOffer->update([
                'status' => EnrollmentOfferStatus::Accepted,
                'accepted_at' => now(),
            ]);

            return $student;
        });

        return new StudentResource($student);
    }

    public function declineOffer(
        Request $request,
        EnrollmentOffer $enrollmentOffer,
        RecordLeadActivity $recordActivity,
    ): EnrollmentOfferResource {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        if (! in_array($enrollmentOffer->status, [
            EnrollmentOfferStatus::Draft,
            EnrollmentOfferStatus::Sent,
        ], true)) {
            throw ValidationException::withMessages([
                'offer' => ['حالة العرض الحالية لا تسمح بتسجيل الرفض.'],
            ]);
        }

        DB::transaction(function () use ($request, $enrollmentOffer, $recordActivity, $data): void {
            $enrollmentOffer->update([
                'status' => EnrollmentOfferStatus::Declined,
                'declined_at' => now(),
                'notes' => $data['reason'] ?? $enrollmentOffer->notes,
            ]);
            $enrollmentOffer->seatReservation()
                ->where('status', SeatReservationStatus::Held)
                ->update([
                    'status' => SeatReservationStatus::Released,
                    'released_at' => now(),
                    'release_reason' => 'تم رفض عرض التسجيل.',
                ]);
            $recordActivity->handle($enrollmentOffer->lead, [
                'type' => 'offer_declined',
                'channel' => 'system',
                'direction' => 'inbound',
                'title' => 'تم رفض عرض التسجيل',
                'details' => $data['reason'] ?? "تم رفض العرض {$enrollmentOffer->offer_number}.",
                'metadata' => ['offer_id' => $enrollmentOffer->id],
            ], $request->user());
        });

        return new EnrollmentOfferResource($this->loadOffer($enrollmentOffer));
    }

    public function storeTrial(
        StoreTrialBookingRequest $request,
        Lead $lead,
        RecordLeadActivity $recordActivity,
    ): TrialBookingResource {
        $this->ensureLeadIsOpen($lead);
        $data = $request->validated();
        $cohort = Cohort::query()
            ->whereIn('status', ['enrolling', 'active'])
            ->findOrFail($data['cohort_id']);
        $trial = DB::transaction(function () use (
            $request,
            $lead,
            $cohort,
            $data,
            $recordActivity,
        ): TrialBooking {
            $trial = TrialBooking::query()->create([
                ...$data,
                'lead_id' => $lead->id,
                'created_by' => $request->user()->id,
                'status' => TrialBookingStatus::Scheduled,
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'meeting_url' => $data['meeting_url'] ?? $cohort->meeting_url,
                'room_name' => $data['room_name'] ?? $cohort->room_name,
            ]);
            $lead->update(['status' => LeadStatus::TrialScheduled]);
            $recordActivity->handle($lead, [
                'type' => 'trial_scheduled',
                'channel' => 'system',
                'direction' => 'outbound',
                'title' => 'تم حجز حصة تجريبية',
                'details' => "موعد التجربة في {$cohort->name}: {$trial->scheduled_at->format('Y-m-d H:i')}.",
                'metadata' => [
                    'trial_id' => $trial->id,
                    'cohort_id' => $cohort->id,
                ],
            ], $request->user());

            return $trial;
        });

        return new TrialBookingResource($this->loadTrial($trial));
    }

    public function updateTrial(
        UpdateTrialBookingRequest $request,
        TrialBooking $trialBooking,
        RecordLeadActivity $recordActivity,
    ): TrialBookingResource {
        $status = TrialBookingStatus::from($request->validated('status'));
        $trialBooking->update([
            'status' => $status,
            'notes' => $request->validated('notes') ?? $trialBooking->notes,
            'confirmed_at' => $status === TrialBookingStatus::Confirmed
                ? ($trialBooking->confirmed_at ?? now())
                : $trialBooking->confirmed_at,
            'attended_at' => $status === TrialBookingStatus::Attended ? now() : null,
        ]);

        if ($status === TrialBookingStatus::Attended
            && $trialBooking->lead->status !== LeadStatus::Won) {
            $trialBooking->lead->update(['status' => LeadStatus::Qualified]);
        }

        $recordActivity->handle($trialBooking->lead, [
            'type' => 'trial_status',
            'channel' => 'system',
            'direction' => 'internal',
            'title' => 'تم تحديث حالة الحصة التجريبية',
            'details' => "الحالة الجديدة: {$status->value}.",
            'metadata' => [
                'trial_id' => $trialBooking->id,
                'status' => $status->value,
            ],
        ], $request->user());

        return new TrialBookingResource($this->loadTrial($trialBooking));
    }

    public function storeSeat(
        StoreSeatRequest $request,
        Lead $lead,
        ReserveSeatOrWaitlist $reserveSeat,
        RecordLeadActivity $recordActivity,
    ): JsonResponse {
        $this->ensureLeadIsOpen($lead);
        $cohort = Cohort::query()
            ->whereIn('status', ['enrolling', 'active'])
            ->findOrFail($request->validated('cohort_id'));
        $settings = AcademySetting::query()->first();
        $result = $reserveSeat->execute(
            $lead,
            $cohort,
            $request->user(),
            null,
            $request->validated('hold_hours') ?? $settings?->seat_hold_hours ?? 48,
            $request->validated('notes'),
        );
        $recordActivity->handle($lead, [
            'type' => $result['mode'] === 'reservation' ? 'seat_reserved' : 'waitlisted',
            'channel' => 'system',
            'direction' => 'internal',
            'title' => $result['mode'] === 'reservation'
                ? 'تم حجز مقعد مؤقت'
                : 'تمت الإضافة لقائمة الانتظار',
            'details' => $result['mode'] === 'reservation'
                ? "تم حجز مقعد في {$cohort->name} حتى {$result['item']->reserved_until->format('Y-m-d H:i')}."
                : "الجروب {$cohort->name} مكتمل حاليًا؛ تمت إضافة العميل لقائمة الانتظار.",
            'metadata' => [
                'cohort_id' => $cohort->id,
                'mode' => $result['mode'],
            ],
        ], $request->user());

        return $this->seatResultResponse($request, $result);
    }

    public function promoteWaitlist(
        Request $request,
        WaitlistEntry $waitlistEntry,
        ReserveSeatOrWaitlist $reserveSeat,
        RecordLeadActivity $recordActivity,
    ): JsonResponse {
        if (! in_array($waitlistEntry->status, [
            WaitlistStatus::Waiting,
            WaitlistStatus::Offered,
        ], true)) {
            throw ValidationException::withMessages([
                'waitlist' => ['حالة قائمة الانتظار الحالية لا تسمح بعرض مقعد.'],
            ]);
        }

        $result = $reserveSeat->execute(
            $waitlistEntry->lead,
            $waitlistEntry->cohort,
            $request->user(),
            null,
            48,
            $waitlistEntry->notes,
        );

        if ($result['mode'] === 'reservation') {
            $recordActivity->handle($waitlistEntry->lead, [
                'type' => 'waitlist_promoted',
                'channel' => 'system',
                'direction' => 'outbound',
                'title' => 'أصبح هناك مقعد متاح',
                'details' => "تم حجز مقعد مؤقت في {$waitlistEntry->cohort->name} للعميل.",
                'metadata' => [
                    'cohort_id' => $waitlistEntry->cohort_id,
                    'reservation_id' => $result['item']->id,
                ],
            ], $request->user());
        }

        return $this->seatResultResponse($request, $result);
    }

    public function releaseReservation(
        Request $request,
        SeatReservation $seatReservation,
        RecordLeadActivity $recordActivity,
    ): SeatReservationResource {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($seatReservation->status !== SeatReservationStatus::Held) {
            throw ValidationException::withMessages([
                'reservation' => ['لا يمكن تحرير حجز غير نشط.'],
            ]);
        }

        $seatReservation->update([
            'status' => SeatReservationStatus::Released,
            'released_at' => now(),
            'release_reason' => $data['reason'] ?? 'تم تحرير المقعد يدويًا.',
        ]);
        $recordActivity->handle($seatReservation->lead, [
            'type' => 'seat_released',
            'channel' => 'system',
            'direction' => 'internal',
            'title' => 'تم تحرير المقعد المحجوز',
            'details' => $data['reason'] ?? "تم تحرير المقعد في {$seatReservation->cohort->name}.",
            'metadata' => ['reservation_id' => $seatReservation->id],
        ], $request->user());

        return new SeatReservationResource(
            $seatReservation->fresh()->load(['lead', 'cohort', 'reserver:id,name']),
        );
    }

    private function ensureLeadIsOpen(Lead $lead): void
    {
        if ($lead->student()->exists() || $lead->status === LeadStatus::Won) {
            throw ValidationException::withMessages([
                'lead' => ['تم تسجيل هذا العميل كطالب بالفعل.'],
            ]);
        }
    }

    private function expireStaleRecords(): void
    {
        EnrollmentOffer::query()
            ->whereIn('status', [EnrollmentOfferStatus::Draft, EnrollmentOfferStatus::Sent])
            ->whereDate('valid_until', '<', today())
            ->update(['status' => EnrollmentOfferStatus::Expired]);
        SeatReservation::query()
            ->where('status', SeatReservationStatus::Held)
            ->where('reserved_until', '<=', now())
            ->update([
                'status' => SeatReservationStatus::Expired,
                'released_at' => now(),
                'release_reason' => 'انتهت مدة حجز المقعد تلقائيًا.',
            ]);
        WaitlistEntry::query()
            ->where('status', WaitlistStatus::Offered)
            ->where('offered_until', '<=', now())
            ->update([
                'status' => WaitlistStatus::Waiting,
                'offered_until' => null,
            ]);
    }

    /**
     * @param  array{mode: 'reservation'|'waitlist', item: SeatReservation|WaitlistEntry}  $result
     */
    private function seatResultResponse(Request $request, array $result): JsonResponse
    {
        $item = $result['mode'] === 'reservation'
            ? (new SeatReservationResource(
                $result['item']->load(['lead', 'cohort', 'reserver:id,name']),
            ))->resolve($request)
            : (new WaitlistEntryResource(
                $result['item']->load(['lead', 'cohort', 'creator:id,name']),
            ))->resolve($request);

        return response()->json([
            'data' => [
                'mode' => $result['mode'],
                'item' => $item,
            ],
        ]);
    }

    private function loadOffer(EnrollmentOffer $offer): EnrollmentOffer
    {
        return $offer->load(['lead', 'cohort', 'creator:id,name', 'seatReservation']);
    }

    private function loadTrial(TrialBooking $trial): TrialBooking
    {
        return $trial->load(['lead', 'cohort', 'creator:id,name']);
    }
}
