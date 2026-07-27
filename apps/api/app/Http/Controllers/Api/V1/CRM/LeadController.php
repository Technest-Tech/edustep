<?php

namespace App\Http\Controllers\Api\V1\CRM;

use App\Enums\FollowUpStatus;
use App\Enums\LeadStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CRM\StoreLeadRequest;
use App\Http\Requests\Api\V1\CRM\UpdateLeadRequest;
use App\Http\Resources\Api\V1\CRM\LeadListResource;
use App\Http\Resources\Api\V1\CRM\LeadResource;
use App\Models\Lead;
use App\Modules\CRM\Actions\RecordLeadActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class LeadController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->filteredQuery($request)
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->latest();

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return LeadListResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function pipeline(Request $request): JsonResponse
    {
        $limitPerStage = min(max($request->integer('limit_per_stage', 50), 5), 100);
        $baseQuery = $this->filteredQuery($request);

        $columns = collect(LeadStatus::cases())->map(
            function (LeadStatus $status) use ($baseQuery, $limitPerStage, $request): array {
                $stageQuery = (clone $baseQuery)->where('status', $status->value);
                $count = (clone $stageQuery)->count();
                $leads = $stageQuery
                    ->latest()
                    ->limit($limitPerStage)
                    ->get();

                return [
                    'status' => [
                        'value' => $status->value,
                        'label' => $status->label(),
                    ],
                    'count' => $count,
                    'has_more' => $count > $leads->count(),
                    'leads' => LeadListResource::collection($leads)->resolve($request),
                ];
            },
        );

        return response()->json([
            'data' => [
                'columns' => $columns,
                'total' => $columns->sum('count'),
                'limit_per_stage' => $limitPerStage,
            ],
        ]);
    }

    public function store(StoreLeadRequest $request, RecordLeadActivity $recordActivity): LeadResource
    {
        $attributes = $request->validated();
        $lead = Lead::query()->create([
            ...$attributes,
            'owner_id' => $attributes['owner_id'] ?? $request->user()->id,
            'whatsapp_phone' => $attributes['whatsapp_phone'] ?? $attributes['phone'],
            'status' => LeadStatus::New,
        ]);

        $recordActivity->handle($lead, [
            'type' => 'lead_created',
            'channel' => $lead->source->value,
            'direction' => 'inbound',
            'title' => 'تم تسجيل العميل المحتمل',
            'details' => "وصل العميل من قناة {$lead->source->label()}.",
        ], $request->user());

        return new LeadResource($this->loadLead($lead));
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($this->loadLead($lead));
    }

    public function update(
        UpdateLeadRequest $request,
        Lead $lead,
        RecordLeadActivity $recordActivity,
    ): LeadResource {
        $attributes = $request->validated();
        $previousStatus = $lead->status;
        $requestedStatus = isset($attributes['status'])
            ? LeadStatus::from($attributes['status'])
            : $previousStatus;

        if ($requestedStatus === LeadStatus::Won && ! $lead->student()->exists()) {
            throw ValidationException::withMessages([
                'status' => ['استخدم إجراء التحويل لتسجيل العميل كطالب.'],
            ]);
        }

        if ($requestedStatus === LeadStatus::Lost) {
            $attributes['lost_at'] = now();
        } elseif ($previousStatus === LeadStatus::Lost) {
            $attributes['lost_at'] = null;
            $attributes['lost_reason'] = null;
        }

        $lead->update($attributes);

        if ($lead->status !== $previousStatus) {
            $recordActivity->handle($lead, [
                'type' => 'status_change',
                'channel' => 'system',
                'direction' => 'internal',
                'title' => 'تم تحديث مرحلة العميل',
                'details' => "من {$previousStatus->label()} إلى {$lead->status->label()}.",
                'metadata' => [
                    'from' => $previousStatus->value,
                    'to' => $lead->status->value,
                ],
            ], $request->user());
        }

        return new LeadResource($this->loadLead($lead));
    }

    private function loadLead(Lead $lead): Lead
    {
        return $lead->load([
            'interestedProgram',
            'owner',
            'activities.creator',
            'followUps.assignee',
            'placementAssessment.assessor',
            'placementAssessment.recommendedLevel',
            'enrollmentOffers.cohort',
            'enrollmentOffers.creator:id,name',
            'enrollmentOffers.seatReservation',
            'trialBookings.cohort',
            'trialBookings.creator:id,name',
            'seatReservations.cohort',
            'seatReservations.reserver:id,name',
            'waitlistEntries.cohort',
            'waitlistEntries.creator:id,name',
            'student.enrollments.cohort.level',
            'student.enrollments.cohort.program',
        ]);
    }

    /**
     * @return Builder<Lead>
     */
    private function filteredQuery(Request $request): Builder
    {
        return Lead::query()
            ->with([
                'interestedProgram',
                'owner',
                'followUps' => fn ($query) => $query
                    ->where('status', FollowUpStatus::Pending->value)
                    ->with('assignee')
                    ->orderBy('due_at'),
            ])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->string('source')->toString(), fn ($query, string $source) => $query->where('source', $source))
            ->when($request->string('program_id')->toString(), fn ($query, string $programId) => $query->where('interested_program_id', $programId))
            ->when($request->string('owner_id')->toString(), fn ($query, string $ownerId) => $query->where('owner_id', $ownerId))
            ->when($request->boolean('overdue'), function ($query): void {
                $query->whereHas('followUps', fn ($query) => $query
                    ->where('status', FollowUpStatus::Pending->value)
                    ->where('due_at', '<', now()));
            });
    }
}
