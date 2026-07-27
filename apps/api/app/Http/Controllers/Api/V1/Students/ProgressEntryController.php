<?php

namespace App\Http\Controllers\Api\V1\Students;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Students\StoreProgressEntryRequest;
use App\Http\Resources\Api\V1\Students\ProgressEntryResource;
use App\Models\Student;
use App\Modules\Academics\Actions\EvaluateStudentAcademicRisk;

class ProgressEntryController extends Controller
{
    public function store(
        StoreProgressEntryRequest $request,
        Student $student,
        EvaluateStudentAcademicRisk $evaluateStudentAcademicRisk,
    ): ProgressEntryResource {
        abort_if(
            $request->user()->role === 'teacher'
                && ! $student->enrollments()
                    ->whereHas('cohort', fn ($query) => $query->where('teacher_id', $request->user()->id))
                    ->exists(),
            403,
            'لا يمكنك تقييم طالب خارج جروباتك.',
        );

        $progressEntry = $student->progressEntries()->create([
            ...$request->validated(),
            'evaluator_id' => $request->user()->id,
        ]);
        $evaluateStudentAcademicRisk->execute($student->fresh());

        return new ProgressEntryResource(
            $progressEntry->load(['level', 'evaluator']),
        );
    }
}
