<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Enums\AttendanceStatus;
use App\Enums\CohortStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\StudentStatus;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\ClassSession;
use App\Models\Cohort;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Student;
use App\Models\TeacherEarning;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OperationsReportController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $attendance = AttendanceRecord::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $effectiveAttendance = (int) ($attendance[AttendanceStatus::Present->value] ?? 0)
            + (int) ($attendance[AttendanceStatus::Late->value] ?? 0)
            + (int) ($attendance[AttendanceStatus::Absent->value] ?? 0);
        $attended = (int) ($attendance[AttendanceStatus::Present->value] ?? 0)
            + (int) ($attendance[AttendanceStatus::Late->value] ?? 0);

        $invoices = Invoice::query()
            ->where('status', '!=', 'cancelled')
            ->withSum('payments', 'amount')
            ->get();
        $billed = (float) $invoices->sum('total_amount');
        $collected = (float) $invoices->sum(
            fn ($invoice) => (float) ($invoice->payments_sum_amount ?? 0),
        );
        $overdue = (float) $invoices
            ->filter(fn ($invoice) => $invoice->due_on->isPast() && $invoice->status->value !== 'paid')
            ->sum(fn ($invoice) => max(
                0,
                (float) $invoice->total_amount - (float) ($invoice->payments_sum_amount ?? 0),
            ));

        $totalSessions = ClassSession::query()->count();
        $completedSessions = ClassSession::query()->where('status', 'completed')->count();
        $totalLeads = Lead::query()->count();
        $wonLeads = Lead::query()->where('status', LeadStatus::Won->value)->count();

        $cohorts = Cohort::query()
            ->with(['program:id,name_ar', 'level:id,name_ar', 'teacher:id,name'])
            ->withCount([
                'enrollments as active_students_count' => fn ($query) => $query->where('status', 'active'),
                'classSessions as sessions_count',
                'classSessions as completed_sessions_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->whereIn('status', [CohortStatus::Active->value, CohortStatus::Enrolling->value])
            ->orderBy('starts_on')
            ->get()
            ->map(function (Cohort $cohort): array {
                $records = AttendanceRecord::query()
                    ->whereHas('classSession', fn ($query) => $query->where('cohort_id', $cohort->id))
                    ->get(['status']);
                $effective = $records->filter(
                    fn ($record) => $record->status !== AttendanceStatus::Excused,
                );
                $present = $effective->filter(
                    fn ($record) => in_array(
                        $record->status,
                        [AttendanceStatus::Present, AttendanceStatus::Late],
                        true,
                    ),
                );

                return [
                    'id' => $cohort->id,
                    'name' => $cohort->name,
                    'code' => $cohort->code,
                    'program' => $cohort->program->name_ar,
                    'level' => $cohort->level->name_ar,
                    'teacher' => $cohort->teacher?->name,
                    'status' => $cohort->status->value,
                    'capacity' => $cohort->capacity,
                    'active_students' => $cohort->active_students_count,
                    'occupancy_rate' => $cohort->capacity
                        ? round(($cohort->active_students_count / $cohort->capacity) * 100, 1)
                        : 0,
                    'sessions' => $cohort->sessions_count,
                    'completed_sessions' => $cohort->completed_sessions_count,
                    'attendance_rate' => $effective->count()
                        ? round(($present->count() / $effective->count()) * 100, 1)
                        : 0,
                ];
            });

        $leadSources = Lead::query()
            ->select('source', DB::raw('count(*) as total'))
            ->groupBy('source')
            ->pluck('total', 'source');

        $teachers = User::query()
            ->where('role', 'teacher')
            ->withCount([
                'teachingCohorts as active_cohorts_count' => fn ($query) => $query->where('status', 'active'),
                'teachingSessions as completed_sessions_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->with(['teachingCohorts' => fn ($query) => $query
                ->where('status', 'active')
                ->withCount(['enrollments' => fn ($enrollments) => $enrollments->where('status', 'active')])])
            ->get()
            ->map(fn (User $teacher) => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'active_cohorts' => $teacher->active_cohorts_count,
                'active_students' => $teacher->teachingCohorts->sum('enrollments_count'),
                'completed_sessions' => $teacher->completed_sessions_count,
            ]);

        $monthStart = now()->startOfMonth()->subMonths(5);
        $paymentsByMonth = Payment::query()
            ->where('paid_at', '>=', $monthStart)
            ->get()
            ->groupBy(fn (Payment $payment) => $payment->paid_at->format('Y-m'));

        $monthlyRevenue = collect(range(0, 5))->map(function (int $offset) use ($monthStart, $paymentsByMonth): array {
            $month = Carbon::parse($monthStart)->addMonths($offset);

            return [
                'month' => $month->format('Y-m'),
                'label' => $month->locale('ar')->translatedFormat('M Y'),
                'amount' => number_format(
                    (float) ($paymentsByMonth[$month->format('Y-m')] ?? collect())->sum('amount'),
                    2,
                    '.',
                    '',
                ),
            ];
        });
        $paymentsThisMonth = (float) Payment::query()
            ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('amount');
        $operatingExpenses = (float) Expense::query()
            ->where('status', 'paid')
            ->whereBetween('incurred_on', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('amount');
        $teacherCost = (float) TeacherEarning::query()
            ->where('status', '!=', 'void')
            ->whereBetween('earned_on', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'active_students' => Student::query()->where('status', StudentStatus::Active->value)->count(),
                    'active_cohorts' => Cohort::query()->where('status', CohortStatus::Active->value)->count(),
                    'sessions_completion_rate' => $totalSessions
                        ? round(($completedSessions / $totalSessions) * 100, 1)
                        : 0,
                    'attendance_rate' => $effectiveAttendance
                        ? round(($attended / $effectiveAttendance) * 100, 1)
                        : 0,
                    'conversion_rate' => $totalLeads ? round(($wonLeads / $totalLeads) * 100, 1) : 0,
                    'collection_rate' => $billed ? round(($collected / $billed) * 100, 1) : 0,
                ],
                'finance' => [
                    'billed' => number_format($billed, 2, '.', ''),
                    'collected' => number_format($collected, 2, '.', ''),
                    'outstanding' => number_format(max(0, $billed - $collected), 2, '.', ''),
                    'overdue' => number_format($overdue, 2, '.', ''),
                    'operating_expenses' => number_format($operatingExpenses, 2, '.', ''),
                    'teacher_cost' => number_format($teacherCost, 2, '.', ''),
                    'net_operating_cash' => number_format(
                        $paymentsThisMonth - $operatingExpenses - $teacherCost,
                        2,
                        '.',
                        '',
                    ),
                    'monthly_revenue' => $monthlyRevenue,
                ],
                'attendance' => [
                    'present' => (int) ($attendance[AttendanceStatus::Present->value] ?? 0),
                    'late' => (int) ($attendance[AttendanceStatus::Late->value] ?? 0),
                    'absent' => (int) ($attendance[AttendanceStatus::Absent->value] ?? 0),
                    'excused' => (int) ($attendance[AttendanceStatus::Excused->value] ?? 0),
                ],
                'lead_sources' => collect(LeadSource::cases())->map(fn (LeadSource $source) => [
                    'source' => $source->value,
                    'label' => $source->label(),
                    'count' => (int) ($leadSources[$source->value] ?? 0),
                ])->filter(fn (array $source) => $source['count'] > 0)->values(),
                'cohorts' => $cohorts,
                'teachers' => $teachers,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
