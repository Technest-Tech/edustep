<?php

namespace App\Http\Controllers\Api\V1\CRM;

use App\Enums\LeadStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admissions\UpsertPlacementAssessmentRequest;
use App\Http\Resources\Api\V1\CRM\PlacementAssessmentResource;
use App\Models\Lead;
use App\Modules\CRM\Actions\RecordLeadActivity;

class PlacementAssessmentController extends Controller
{
    public function update(
        UpsertPlacementAssessmentRequest $request,
        Lead $lead,
        RecordLeadActivity $recordActivity,
    ): PlacementAssessmentResource {
        $attributes = $request->validated();
        $assessment = $lead->placementAssessment()->updateOrCreate(
            ['lead_id' => $lead->id],
            [
                ...$attributes,
                'assessed_by' => $attributes['assessed_by'] ?? $request->user()->id,
            ],
        );

        if (in_array($lead->status, [LeadStatus::New, LeadStatus::Contacted, LeadStatus::Qualified], true)) {
            $lead->update(['status' => LeadStatus::AssessmentScheduled]);
        }

        $recordActivity->handle($lead, [
            'type' => 'meeting',
            'channel' => 'system',
            'direction' => 'internal',
            'title' => 'تم تحديث اختبار المستوى',
            'details' => $assessment->scheduled_at
                ? 'موعد الاختبار: '.$assessment->scheduled_at->format('Y-m-d H:i')
                : 'تم حفظ نتيجة اختبار المستوى.',
            'metadata' => ['assessment_id' => $assessment->id],
        ], $request->user());

        return new PlacementAssessmentResource(
            $assessment->load(['assessor', 'recommendedLevel']),
        );
    }
}
