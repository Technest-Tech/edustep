<?php

namespace App\Http\Controllers\Api\V1\Management;

use App\Enums\FollowUpStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicRisk;
use App\Models\ClassSession;
use App\Models\Expense;
use App\Models\FamilyServiceRequest;
use App\Models\FollowUp;
use App\Models\Invoice;
use App\Models\TeacherEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationCenterController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = collect();

        $followUps = FollowUp::query()
            ->with('lead:id,full_name')
            ->where('status', FollowUpStatus::Pending->value)
            ->when($user->role !== 'owner', fn ($query) => $query->where('assigned_to', $user->id))
            ->where('due_at', '<=', now()->addDay())
            ->orderBy('due_at')
            ->limit(5)
            ->get();

        foreach ($followUps as $followUp) {
            $isOverdue = $followUp->due_at->isPast();
            $items->push([
                'id' => "follow-up-{$followUp->id}",
                'type' => 'follow_up',
                'title' => $isOverdue ? 'متابعة متأخرة' : 'متابعة قريبة',
                'description' => "{$followUp->lead->full_name} · {$followUp->subject}",
                'severity' => $isOverdue ? 'urgent' : 'warning',
                'href' => "/leads/{$followUp->lead_id}",
                'occurred_at' => $followUp->due_at->toIso8601String(),
            ]);
        }

        if (in_array($user->role, ['owner', 'academic_manager', 'teacher'], true)) {
            $risks = AcademicRisk::query()
                ->with('student:id,full_name')
                ->whereIn('status', ['open', 'monitoring'])
                ->when(
                    $user->role === 'teacher',
                    fn ($query) => $query->where(function ($query) use ($user): void {
                        $query
                            ->where('assigned_to', $user->id)
                            ->orWhereHas(
                                'student.enrollments.cohort',
                                fn ($query) => $query->where('teacher_id', $user->id),
                            );
                    }),
                )
                ->orderByRaw("case severity when 'critical' then 1 when 'high' then 2 when 'medium' then 3 else 4 end")
                ->limit(4)
                ->get();

            foreach ($risks as $risk) {
                $items->push([
                    'id' => "academic-risk-{$risk->id}",
                    'type' => 'academic_risk',
                    'title' => $risk->severity === 'critical' ? 'خطر أكاديمي حرج' : 'متابعة أكاديمية مطلوبة',
                    'description' => "{$risk->student->full_name} · {$risk->title}",
                    'severity' => in_array($risk->severity, ['critical', 'high'], true) ? 'urgent' : 'warning',
                    'href' => '/progress',
                    'occurred_at' => $risk->detected_at->toIso8601String(),
                ]);
            }
        }

        if (in_array($user->role, ['owner', 'staff', 'admissions', 'academic_manager'], true)) {
            $serviceRequests = FamilyServiceRequest::query()
                ->with('student:id,full_name')
                ->whereIn('status', ['open', 'in_progress'])
                ->when(
                    $user->role !== 'owner',
                    fn ($query) => $query->where(function ($query) use ($user): void {
                        $query->whereNull('assigned_to')->orWhere('assigned_to', $user->id);
                    }),
                )
                ->latest()
                ->limit(4)
                ->get();

            foreach ($serviceRequests as $serviceRequest) {
                $items->push([
                    'id' => "service-request-{$serviceRequest->id}",
                    'type' => 'service_request',
                    'title' => $serviceRequest->status->value === 'open' ? 'طلب أسرة جديد' : 'طلب أسرة قيد المعالجة',
                    'description' => ($serviceRequest->student?->full_name ?? 'طلب عام').' · '.$serviceRequest->subject,
                    'severity' => in_array($serviceRequest->priority, ['high', 'urgent'], true) ? 'urgent' : 'warning',
                    'href' => '/service-requests',
                    'occurred_at' => $serviceRequest->created_at->toIso8601String(),
                ]);
            }
        }

        if (in_array($user->role, ['owner', 'accountant'], true)) {
            $invoices = Invoice::query()
                ->with('student:id,full_name')
                ->withSum('payments', 'amount')
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->whereDate('due_on', '<', today())
                ->orderBy('due_on')
                ->limit(4)
                ->get();

            foreach ($invoices as $invoice) {
                $balance = max(
                    0,
                    (float) $invoice->total_amount - (float) ($invoice->payments_sum_amount ?? 0),
                );

                if ($balance <= 0) {
                    continue;
                }

                $items->push([
                    'id' => "invoice-{$invoice->id}",
                    'type' => 'invoice',
                    'title' => 'تحصيل متأخر',
                    'description' => "{$invoice->student->full_name} · {$invoice->invoice_number} · ".number_format($balance, 0).' ج.م',
                    'severity' => 'urgent',
                    'href' => '/finance',
                    'occurred_at' => $invoice->due_on->startOfDay()->toIso8601String(),
                ]);
            }

            $submittedExpenses = Expense::query()->where('status', 'submitted')->count();

            if ($submittedExpenses > 0 && $user->role === 'owner') {
                $items->push([
                    'id' => 'expenses-awaiting-approval',
                    'type' => 'expense',
                    'title' => 'مصروفات تنتظر الاعتماد',
                    'description' => "{$submittedExpenses} مصروفات تحتاج مراجعة المدير.",
                    'severity' => 'warning',
                    'href' => '/payroll',
                    'occurred_at' => now()->toIso8601String(),
                ]);
            }

            $pendingEarnings = TeacherEarning::query()->where('status', 'pending')->get();

            if ($pendingEarnings->isNotEmpty() && $user->role === 'owner') {
                $items->push([
                    'id' => 'teacher-earnings-awaiting-approval',
                    'type' => 'payroll',
                    'title' => 'مستحقات معلمين للمراجعة',
                    'description' => $pendingEarnings->count().' مستحقات بقيمة '
                        .number_format((float) $pendingEarnings->sum('amount'), 0).' ج.م',
                    'severity' => 'warning',
                    'href' => '/payroll',
                    'occurred_at' => now()->toIso8601String(),
                ]);
            }
        }

        $sessions = ClassSession::query()
            ->with('cohort:id,name,code')
            ->where('status', 'scheduled')
            ->whereBetween('starts_at', [now(), now()->addHours(48)])
            ->when($user->role === 'teacher', fn ($query) => $query->where('teacher_id', $user->id))
            ->orderBy('starts_at')
            ->limit(5)
            ->get();

        foreach ($sessions as $session) {
            $items->push([
                'id' => "session-{$session->id}",
                'type' => 'session',
                'title' => 'حصة قادمة',
                'description' => "{$session->cohort->name} · {$session->title}",
                'severity' => 'info',
                'href' => "/groups/{$session->cohort_id}",
                'occurred_at' => $session->starts_at->toIso8601String(),
            ]);
        }

        $sortedItems = $items
            ->sortBy(fn (array $item) => [
                match ($item['severity']) {
                    'urgent' => 0,
                    'warning' => 1,
                    default => 2,
                },
                $item['occurred_at'],
            ])
            ->take(10)
            ->values();

        return response()->json([
            'data' => [
                'unread_count' => $sortedItems->count(),
                'items' => $sortedItems,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
