<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academics\GenerateCohortScheduleRequest;
use App\Http\Resources\Api\V1\Academics\ClassSessionResource;
use App\Models\Cohort;
use App\Modules\Academics\Actions\GenerateCohortSchedule;
use Illuminate\Http\JsonResponse;

class CohortScheduleController extends Controller
{
    public function store(
        GenerateCohortScheduleRequest $request,
        Cohort $cohort,
        GenerateCohortSchedule $generateSchedule,
    ): JsonResponse {
        abort_if(
            $request->user()->role === 'teacher' && $cohort->teacher_id !== $request->user()->id,
            403,
            'لا يمكنك توليد جدول جروب غير مسند إليك.',
        );

        $result = $generateSchedule->execute($cohort, $request->validated());
        $sessions = $result['created']->map(
            fn ($session) => $session->load(['teacher', 'attendanceRecords.student']),
        );

        return response()->json([
            'data' => [
                'summary' => $result['summary'],
                'closures' => $result['closures'],
                'conflicts' => $result['conflicts'],
                'sessions' => ClassSessionResource::collection($sessions)->resolve($request),
            ],
        ], 201);
    }
}
