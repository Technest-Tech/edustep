<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Enums\CohortStatus;
use App\Enums\FollowUpStatus;
use App\Enums\LeadStatus;
use App\Enums\StudentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Academics\CohortResource;
use App\Http\Resources\Api\V1\CRM\FollowUpResource;
use App\Http\Resources\Api\V1\CRM\LeadListResource;
use App\Models\Cohort;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $pendingFollowUps = FollowUp::query()
            ->where('status', FollowUpStatus::Pending->value);

        $funnel = Lead::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentLeads = Lead::query()
            ->with([
                'interestedProgram',
                'owner',
                'followUps' => fn ($query) => $query
                    ->where('status', FollowUpStatus::Pending->value)
                    ->orderBy('due_at'),
            ])
            ->latest()
            ->limit(5)
            ->get();

        $todayFollowUps = FollowUp::query()
            ->with(['lead', 'assignee'])
            ->where('status', FollowUpStatus::Pending->value)
            ->where('due_at', '<=', now()->endOfDay())
            ->orderBy('due_at')
            ->limit(6)
            ->get();

        $cohorts = Cohort::query()
            ->with(['program', 'level', 'teacher'])
            ->withCount(['enrollments' => fn ($query) => $query->where('status', 'active')])
            ->whereIn('status', [CohortStatus::Active->value, CohortStatus::Enrolling->value])
            ->orderBy('starts_on')
            ->limit(4)
            ->get();

        return response()->json([
            'data' => [
                'metrics' => [
                    'open_leads' => Lead::query()->whereNotIn('status', [
                        LeadStatus::Won->value,
                        LeadStatus::Lost->value,
                    ])->count(),
                    'new_leads' => Lead::query()->where('status', LeadStatus::New->value)->count(),
                    'active_students' => Student::query()->where('status', StudentStatus::Active->value)->count(),
                    'active_cohorts' => Cohort::query()->where('status', CohortStatus::Active->value)->count(),
                    'pending_follow_ups' => (clone $pendingFollowUps)->count(),
                    'overdue_follow_ups' => (clone $pendingFollowUps)->where('due_at', '<', now())->count(),
                    'conversion_rate' => $this->conversionRate(),
                ],
                'funnel' => collect(LeadStatus::cases())->map(fn (LeadStatus $status) => [
                    'status' => $status->value,
                    'label' => $status->label(),
                    'count' => (int) ($funnel[$status->value] ?? 0),
                ])->values(),
                'recent_leads' => LeadListResource::collection($recentLeads),
                'today_follow_ups' => FollowUpResource::collection($todayFollowUps),
                'cohorts' => CohortResource::collection($cohorts),
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    private function conversionRate(): float
    {
        $total = Lead::query()->count();

        if ($total === 0) {
            return 0;
        }

        $won = Lead::query()->where('status', LeadStatus::Won->value)->count();

        return round(($won / $total) * 100, 1);
    }
}
