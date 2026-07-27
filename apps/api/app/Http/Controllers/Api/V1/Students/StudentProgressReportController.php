<?php

namespace App\Http\Controllers\Api\V1\Students;

use App\Enums\MessageChannel;
use App\Enums\MessageStatus;
use App\Enums\ProgressReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Students\StoreProgressReportRequest;
use App\Http\Resources\Api\V1\Students\StudentProgressReportResource;
use App\Models\Message;
use App\Models\Student;
use App\Models\StudentProgressReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentProgressReportController extends Controller
{
    public function store(
        StoreProgressReportRequest $request,
        Student $student,
    ): StudentProgressReportResource {
        $this->authorizeStudent($request, $student);

        $report = $student->progressReports()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'status' => ProgressReportStatus::Draft,
        ]);

        return new StudentProgressReportResource(
            $report->load(['student', 'level', 'creator', 'publisher']),
        );
    }

    public function publish(
        Request $request,
        StudentProgressReport $studentProgressReport,
    ): StudentProgressReportResource {
        $studentProgressReport->load('student.guardians.user');
        $this->authorizeStudent($request, $studentProgressReport->student);
        abort_unless(
            $studentProgressReport->status === ProgressReportStatus::Draft,
            422,
            'يمكن نشر التقارير المسودة فقط.',
        );

        DB::transaction(function () use ($request, $studentProgressReport): void {
            $studentProgressReport->update([
                'status' => ProgressReportStatus::Published,
                'published_by' => $request->user()->id,
                'published_at' => now(),
            ]);

            $studentProgressReport->student->guardians->each(
                function ($guardian) use ($request, $studentProgressReport): void {
                    Message::query()->create([
                        'sender_id' => $request->user()->id,
                        'guardian_id' => $guardian->id,
                        'student_id' => $studentProgressReport->student_id,
                        'channel' => MessageChannel::Internal,
                        'direction' => 'outbound',
                        'subject' => 'تقرير تقدم جديد · '.$studentProgressReport->period_label,
                        'body' => 'تم نشر تقرير تقدم جديد للطالب '
                            .$studentProgressReport->student->full_name
                            .' ويمكن مراجعته الآن من بوابة الأسرة.',
                        'status' => MessageStatus::Delivered,
                        'sent_at' => now(),
                        'delivered_at' => now(),
                        'metadata' => [
                            'provider_connected' => true,
                            'progress_report_id' => $studentProgressReport->id,
                        ],
                    ]);
                },
            );
        });

        return new StudentProgressReportResource(
            $studentProgressReport->fresh()->load(['student', 'level', 'creator', 'publisher']),
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
            'لا يمكنك إدارة تقرير طالب خارج جروباتك.',
        );
    }
}
