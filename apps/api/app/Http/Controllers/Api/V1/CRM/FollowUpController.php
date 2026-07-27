<?php

namespace App\Http\Controllers\Api\V1\CRM;

use App\Enums\FollowUpStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CRM\StoreFollowUpRequest;
use App\Http\Requests\Api\V1\CRM\UpdateFollowUpRequest;
use App\Http\Resources\Api\V1\CRM\FollowUpResource;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Modules\CRM\Actions\RecordLeadActivity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FollowUpController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = FollowUp::query()
            ->with(['lead', 'assignee'])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->boolean('overdue'), fn ($query) => $query
                ->where('status', FollowUpStatus::Pending->value)
                ->where('due_at', '<', now()))
            ->when($request->string('assigned_to')->toString(), fn ($query, string $userId) => $query->where('assigned_to', $userId))
            ->orderBy('due_at');

        return FollowUpResource::collection($query->paginate(min($request->integer('per_page', 20), 100)));
    }

    public function store(
        StoreFollowUpRequest $request,
        Lead $lead,
        RecordLeadActivity $recordActivity,
    ): FollowUpResource {
        $attributes = $request->validated();
        $followUp = $lead->followUps()->create([
            ...$attributes,
            'assigned_to' => $attributes['assigned_to'] ?? $request->user()->id,
            'status' => FollowUpStatus::Pending,
        ]);

        $recordActivity->handle($lead, [
            'type' => 'note',
            'channel' => 'system',
            'direction' => 'internal',
            'title' => 'تمت إضافة متابعة',
            'details' => $followUp->subject,
            'metadata' => ['follow_up_id' => $followUp->id],
        ], $request->user());

        return new FollowUpResource($followUp->load(['lead', 'assignee']));
    }

    public function update(
        UpdateFollowUpRequest $request,
        FollowUp $followUp,
        RecordLeadActivity $recordActivity,
    ): FollowUpResource {
        $attributes = $request->validated();
        $status = isset($attributes['status'])
            ? FollowUpStatus::from($attributes['status'])
            : $followUp->status;

        $attributes['completed_at'] = $status === FollowUpStatus::Completed
            ? ($followUp->completed_at ?? now())
            : null;

        $followUp->update($attributes);

        if ($status === FollowUpStatus::Completed) {
            $recordActivity->handle($followUp->lead, [
                'type' => 'note',
                'channel' => 'system',
                'direction' => 'internal',
                'title' => 'اكتملت المتابعة',
                'details' => $followUp->subject,
                'metadata' => ['follow_up_id' => $followUp->id],
            ], $request->user());
        }

        return new FollowUpResource($followUp->load(['lead', 'assignee']));
    }
}
