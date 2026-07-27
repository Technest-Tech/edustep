<?php

namespace App\Http\Controllers\Api\V1\Family;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Communication\MessageResource;
use App\Http\Resources\Api\V1\Family\FamilyServiceRequestResource;
use App\Http\Resources\Api\V1\Students\StudentProgressReportResource;
use App\Models\ClassSession;
use App\Models\GuardianProfile;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyHomeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $guardian = GuardianProfile::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'students.enrollments.cohort.program:id,name_ar',
                'students.enrollments.cohort.level:id,code,name_ar',
                'students.enrollments.cohort.teacher:id,name',
                'students.attendanceRecords.classSession:id,title,starts_at',
                'students.progressEntries' => fn ($query) => $query
                    ->with(['level:id,code,name_ar', 'evaluator:id,name'])
                    ->latest('occurred_on'),
                'students.progressReports' => fn ($query) => $query
                    ->where('status', 'published')
                    ->with(['level:id,code,name_ar', 'creator:id,name', 'publisher:id,name'])
                    ->latest('published_at'),
                'students.invoices.payments',
                'students.invoices.enrollment.cohort:id,name,code',
                'serviceRequests' => fn ($query) => $query
                    ->with(['student:id,student_code,full_name', 'assignee:id,name'])
                    ->latest(),
            ])
            ->firstOrFail();
        $messages = $guardian->messages()
            ->with(['sender:id,name', 'guardian.user:id,name', 'student:id,student_code,full_name', 'template:id,name'])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'guardian' => [
                    'id' => $guardian->id,
                    'name' => $request->user()->name,
                    'phone' => $guardian->phone,
                    'preferred_channel' => $guardian->preferred_channel,
                    'relationship_label' => $guardian->relationship_label,
                ],
                'summary' => [
                    'children' => $guardian->students->count(),
                    'outstanding_balance' => number_format(
                        (float) $guardian->students
                            ->flatMap->invoices
                            ->sum(fn ($invoice) => (float) $invoice->balance),
                        2,
                        '.',
                        '',
                    ),
                    'unread_messages' => $messages->whereNull('read_at')->count(),
                    'open_requests' => $guardian->serviceRequests
                        ->whereIn('status.value', ['open', 'in_progress'])
                        ->count(),
                ],
                'children' => $guardian->students
                    ->map(fn (Student $student) => $this->childPayload($student))
                    ->values(),
                'messages' => MessageResource::collection($messages)->resolve($request),
                'service_requests' => FamilyServiceRequestResource::collection(
                    $guardian->serviceRequests,
                )->resolve($request),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function childPayload(Student $student): array
    {
        $activeEnrollment = $student->enrollments
            ->first(fn ($enrollment) => $enrollment->status->value === 'active');
        $attendance = $student->attendanceRecords;
        $effectiveAttendance = $attendance->filter(fn ($record) => $record->status->value !== 'excused');
        $attended = $effectiveAttendance->filter(
            fn ($record) => in_array($record->status->value, ['present', 'late'], true),
        );
        $nextSession = $activeEnrollment
            ? ClassSession::query()
                ->where('cohort_id', $activeEnrollment->cohort_id)
                ->where('status', 'scheduled')
                ->where('starts_at', '>=', now())
                ->orderBy('starts_at')
                ->first()
            : null;

        return [
            'id' => $student->id,
            'student_code' => $student->student_code,
            'full_name' => $student->full_name,
            'status' => $student->status->value,
            'cohort' => $activeEnrollment ? [
                'id' => $activeEnrollment->cohort->id,
                'code' => $activeEnrollment->cohort->code,
                'name' => $activeEnrollment->cohort->name,
                'delivery_mode' => $activeEnrollment->cohort->delivery_mode,
                'level' => $activeEnrollment->cohort->level?->name_ar,
                'program' => $activeEnrollment->cohort->program?->name_ar,
                'teacher' => $activeEnrollment->cohort->teacher?->name,
            ] : null,
            'attendance' => [
                'records' => $attendance->count(),
                'absences' => $attendance->where('status.value', 'absent')->count(),
                'rate' => $effectiveAttendance->count()
                    ? round(($attended->count() / $effectiveAttendance->count()) * 100, 1)
                    : 0,
            ],
            'next_session' => $nextSession ? [
                'id' => $nextSession->id,
                'title' => $nextSession->title,
                'starts_at' => $nextSession->starts_at->toIso8601String(),
                'ends_at' => $nextSession->ends_at->toIso8601String(),
                'meeting_url' => $nextSession->meeting_url,
                'room_name' => $nextSession->room_name,
            ] : null,
            'latest_progress' => $student->progressEntries->take(4)->map(fn ($entry) => [
                'id' => $entry->id,
                'type' => $entry->type,
                'title' => $entry->title,
                'score' => $entry->score,
                'rating' => $entry->rating->value,
                'feedback' => $entry->feedback,
                'occurred_on' => $entry->occurred_on->toDateString(),
                'level' => $entry->level?->name_ar,
                'evaluator' => $entry->evaluator?->name,
            ])->values(),
            'published_reports' => StudentProgressReportResource::collection(
                $student->progressReports,
            )->resolve(),
            'invoices' => $student->invoices
                ->sortByDesc('issued_on')
                ->map(fn ($invoice) => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'status' => $invoice->status->value,
                    'issued_on' => $invoice->issued_on->toDateString(),
                    'due_on' => $invoice->due_on?->toDateString(),
                    'total_amount' => $invoice->total_amount,
                    'paid_amount' => $invoice->paid_amount,
                    'balance' => $invoice->balance,
                ])->values(),
        ];
    }
}
