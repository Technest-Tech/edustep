<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Enums\ClassSessionStatus;
use App\Enums\TeacherEarningStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Academics\ClassSessionResource;
use App\Models\ClassSession;
use App\Models\Cohort;
use App\Models\TeacherEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherTodayController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $teacher = $request->user();
        $sessionQuery = ClassSession::query()
            ->with([
                'cohort.program:id,name_ar',
                'cohort.level:id,name_ar',
                'teacher:id,name',
                'attendanceRecords.student:id,student_code,full_name',
                'teacherEarning:id,class_session_id,status,amount',
            ])
            ->where('teacher_id', $teacher->id);

        $todaySessions = (clone $sessionQuery)
            ->whereBetween('starts_at', [today()->startOfDay(), today()->endOfDay()])
            ->orderBy('starts_at')
            ->get();
        $upcomingSessions = (clone $sessionQuery)
            ->where('starts_at', '>', today()->endOfDay())
            ->where('starts_at', '<=', now()->addDays(7)->endOfDay())
            ->where('status', ClassSessionStatus::Scheduled)
            ->orderBy('starts_at')
            ->get();
        $missingReports = (clone $sessionQuery)
            ->where('status', ClassSessionStatus::Completed)
            ->whereNull('teacher_notes')
            ->where('starts_at', '>=', now()->subDays(14)->startOfDay())
            ->latest('starts_at')
            ->get();

        $cohorts = Cohort::query()
            ->where('teacher_id', $teacher->id)
            ->whereIn('status', ['active', 'enrolling'])
            ->withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
            ->get();
        $earnings = TeacherEarning::query()
            ->where('teacher_id', $teacher->id)
            ->whereBetween('earned_on', [today()->startOfMonth(), today()->endOfMonth()])
            ->get();

        return response()->json([
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                ],
                'date' => today()->toDateString(),
                'summary' => [
                    'today_sessions' => $todaySessions->count(),
                    'active_cohorts' => $cohorts->where('status.value', 'active')->count(),
                    'active_students' => $cohorts->sum('enrollments_count'),
                    'missing_reports' => $missingReports->count(),
                    'month_earnings' => number_format(
                        (float) $earnings->where('status', '!=', TeacherEarningStatus::Void)->sum('amount'),
                        2,
                        '.',
                        '',
                    ),
                ],
                'today_sessions' => ClassSessionResource::collection($todaySessions)->resolve($request),
                'upcoming_sessions' => ClassSessionResource::collection($upcomingSessions)->resolve($request),
                'missing_reports' => ClassSessionResource::collection($missingReports)->resolve($request),
                'cohorts' => $cohorts->map(fn (Cohort $cohort) => [
                    'id' => $cohort->id,
                    'code' => $cohort->code,
                    'name' => $cohort->name,
                    'status' => $cohort->status->value,
                    'students_count' => $cohort->enrollments_count,
                ])->values(),
            ],
        ]);
    }
}
