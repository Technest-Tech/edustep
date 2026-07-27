<?php

namespace App\Http\Controllers\Api\V1\Students;

use App\Enums\AcademicRiskStatus;
use App\Enums\InterventionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Students\StoreAcademicInterventionRequest;
use App\Http\Requests\Api\V1\Students\StoreAcademicRiskRequest;
use App\Http\Requests\Api\V1\Students\UpdateAcademicInterventionRequest;
use App\Http\Requests\Api\V1\Students\UpdateAcademicRiskRequest;
use App\Http\Resources\Api\V1\Students\AcademicInterventionResource;
use App\Http\Resources\Api\V1\Students\AcademicRiskResource;
use App\Models\AcademicIntervention;
use App\Models\AcademicRisk;
use App\Models\Student;
use Illuminate\Http\Request;

class AcademicRiskController extends Controller
{
    public function store(
        StoreAcademicRiskRequest $request,
        Student $student,
    ): AcademicRiskResource {
        $this->authorizeStudent($request, $student);
        $risk = $student->academicRisks()->create([
            ...$request->validated(),
            'status' => AcademicRiskStatus::Open,
            'is_automatic' => false,
            'detected_at' => now(),
        ]);

        return new AcademicRiskResource(
            $risk->load(['assignee', 'interventions.owner', 'interventions.creator']),
        );
    }

    public function update(
        UpdateAcademicRiskRequest $request,
        AcademicRisk $academicRisk,
    ): AcademicRiskResource {
        $this->authorizeStudent($request, $academicRisk->student);
        $data = $request->validated();
        $data['resolved_at'] = $data['status'] === AcademicRiskStatus::Resolved->value
            ? now()
            : null;
        $academicRisk->update($data);

        return new AcademicRiskResource(
            $academicRisk->fresh()->load(['assignee', 'interventions.owner', 'interventions.creator']),
        );
    }

    public function storeIntervention(
        StoreAcademicInterventionRequest $request,
        AcademicRisk $academicRisk,
    ): AcademicInterventionResource {
        $this->authorizeStudent($request, $academicRisk->student);
        $intervention = $academicRisk->interventions()->create([
            ...$request->validated(),
            'student_id' => $academicRisk->student_id,
            'created_by' => $request->user()->id,
            'owner_id' => $request->validated('owner_id') ?? $request->user()->id,
            'status' => InterventionStatus::Planned,
        ]);

        if ($academicRisk->status === AcademicRiskStatus::Open) {
            $academicRisk->update(['status' => AcademicRiskStatus::Monitoring]);
        }

        return new AcademicInterventionResource(
            $intervention->load(['owner', 'creator']),
        );
    }

    public function updateIntervention(
        UpdateAcademicInterventionRequest $request,
        AcademicIntervention $academicIntervention,
    ): AcademicInterventionResource {
        $this->authorizeStudent($request, $academicIntervention->student);
        $data = $request->validated();
        $data['completed_at'] = $data['status'] === InterventionStatus::Completed->value
            ? now()
            : null;
        $academicIntervention->update($data);

        return new AcademicInterventionResource(
            $academicIntervention->fresh()->load(['owner', 'creator']),
        );
    }

    private function authorizeStudent(Request $request, Student $student): void
    {
        abort_if(
            $request->user()->role === 'teacher'
                && ! $student->enrollments()
                    ->whereHas('cohort', fn ($query) => $query->where('teacher_id', $request->user()->id))
                    ->exists(),
            403,
            'لا يمكنك إدارة طالب خارج جروباتك.',
        );
    }
}
