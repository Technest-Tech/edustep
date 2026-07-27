<?php

namespace App\Http\Controllers\Api\V1\Students;

use App\Enums\ProgressReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Students\AcademicRiskResource;
use App\Http\Resources\Api\V1\Students\StudentProgressReportResource;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicProgressController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $students = Student::query()
            ->when(
                $request->user()->role === 'teacher',
                fn ($query) => $query->whereHas(
                    'enrollments.cohort',
                    fn ($query) => $query->where('teacher_id', $request->user()->id),
                ),
            )
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%");
                });
            })
            ->with([
                'enrollments.cohort.level:id,code,name_ar',
                'enrollments.cohort.teacher:id,name',
                'attendanceRecords:id,student_id,status,created_at',
                'progressEntries' => fn ($query) => $query->latest('occurred_on'),
                'progressReports' => fn ($query) => $query
                    ->with(['level:id,code,name_ar', 'creator:id,name', 'publisher:id,name'])
                    ->latest('period_ends_on'),
                'academicRisks' => fn ($query) => $query
                    ->where('status', '!=', 'resolved')
                    ->with([
                        'assignee:id,name',
                        'interventions' => fn ($query) => $query
                            ->with(['owner:id,name', 'creator:id,name'])
                            ->latest(),
                    ])
                    ->latest('detected_at'),
            ])
            ->latest()
            ->get();

        $payload = $students->map(function (Student $student) use ($request): array {
            $activeEnrollment = $student->enrollments
                ->first(fn ($enrollment) => $enrollment->status->value === 'active')
                ?? $student->enrollments->first();
            $effectiveAttendance = $student->attendanceRecords
                ->filter(fn ($record) => $record->status->value !== 'excused');
            $attended = $effectiveAttendance
                ->filter(fn ($record) => in_array($record->status->value, ['present', 'late'], true));
            $scores = $student->progressEntries
                ->whereNotNull('score')
                ->take(5)
                ->map(fn ($entry) => (float) $entry->score);

            return [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'full_name' => $student->full_name,
                'status' => $student->status->value,
                'cohort' => $activeEnrollment?->cohort ? [
                    'id' => $activeEnrollment->cohort->id,
                    'code' => $activeEnrollment->cohort->code,
                    'name' => $activeEnrollment->cohort->name,
                    'level' => $activeEnrollment->cohort->level?->name_ar,
                    'teacher' => $activeEnrollment->cohort->teacher?->name,
                    'enrollment_id' => $activeEnrollment->id,
                    'level_id' => $activeEnrollment->cohort->level_id,
                ] : null,
                'attendance_rate' => $effectiveAttendance->count()
                    ? round(($attended->count() / $effectiveAttendance->count()) * 100, 1)
                    : 0,
                'average_score' => $scores->count() ? round($scores->average(), 1) : null,
                'assessments_count' => $student->progressEntries->count(),
                'open_risks' => AcademicRiskResource::collection($student->academicRisks)->resolve($request),
                'reports' => StudentProgressReportResource::collection($student->progressReports)->resolve($request),
            ];
        })->values();

        return response()->json([
            'data' => [
                'summary' => [
                    'students' => $payload->count(),
                    'at_risk' => $payload->filter(fn ($student) => count($student['open_risks']) > 0)->count(),
                    'open_interventions' => $students
                        ->flatMap->academicRisks
                        ->flatMap->interventions
                        ->whereIn('status.value', ['planned', 'in_progress'])
                        ->count(),
                    'draft_reports' => $students
                        ->flatMap->progressReports
                        ->where('status', ProgressReportStatus::Draft)
                        ->count(),
                    'published_this_month' => $students
                        ->flatMap->progressReports
                        ->filter(fn ($report) => $report->published_at?->isCurrentMonth())
                        ->count(),
                ],
                'students' => $payload,
            ],
        ]);
    }
}
