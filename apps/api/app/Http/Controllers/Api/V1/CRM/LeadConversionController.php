<?php

namespace App\Http\Controllers\Api\V1\CRM;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admissions\ConvertLeadRequest;
use App\Http\Resources\Api\V1\Students\StudentResource;
use App\Models\Lead;
use App\Modules\Admissions\Actions\ConvertLeadToStudent;

class LeadConversionController extends Controller
{
    public function store(
        ConvertLeadRequest $request,
        Lead $lead,
        ConvertLeadToStudent $convertLead,
    ): StudentResource {
        $student = $convertLead->handle(
            $lead,
            $request->validated(),
            $request->user(),
        );

        return new StudentResource($student);
    }
}
