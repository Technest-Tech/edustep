<?php

namespace App\Http\Controllers\Api\V1\CRM;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CRM\StoreLeadActivityRequest;
use App\Http\Resources\Api\V1\CRM\LeadActivityResource;
use App\Models\Lead;
use App\Modules\CRM\Actions\RecordLeadActivity;

class LeadActivityController extends Controller
{
    public function store(
        StoreLeadActivityRequest $request,
        Lead $lead,
        RecordLeadActivity $recordActivity,
    ): LeadActivityResource {
        $activity = $recordActivity->handle(
            $lead,
            $request->validated(),
            $request->user(),
        );

        return new LeadActivityResource($activity->load('creator'));
    }
}
