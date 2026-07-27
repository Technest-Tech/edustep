<?php

namespace App\Http\Resources\Api\V1\People;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->teacherProfile;
        $sessions = $this->relationLoaded('teachingSessions')
            ? $this->teachingSessions
            : collect();
        $earnings = $this->relationLoaded('teacherEarnings')
            ? $this->teacherEarnings
            : collect();
        $completedSessions = $sessions->filter(
            fn ($session) => $session->status->value === 'completed',
        );

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'phone' => $profile?->phone,
            'employment_type' => $profile?->employment_type,
            'specialization' => $profile?->specialization,
            'hourly_rate' => $profile?->hourly_rate,
            'availability' => $profile?->availability,
            'bio' => $profile?->bio,
            'active_cohorts_count' => $this->teaching_cohorts_count ?? 0,
            'active_students_count' => $this->teachingCohorts
                ->flatMap(fn ($cohort) => $cohort->enrollments)
                ->filter(fn ($enrollment) => $enrollment->status->value === 'active')
                ->count(),
            'cohorts' => $this->teachingCohorts->map(fn ($cohort) => [
                'id' => $cohort->id,
                'code' => $cohort->code,
                'name' => $cohort->name,
                'status' => $cohort->status->value,
                'program' => $cohort->program?->name_ar,
                'level' => $cohort->level?->name_ar,
                'students_count' => $cohort->enrollments->count(),
            ]),
            'operational_metrics' => $this->when(
                $this->relationLoaded('teachingSessions'),
                fn () => [
                    'completed_sessions' => $completedSessions->count(),
                    'upcoming_sessions' => $sessions->filter(
                        fn ($session) => $session->status->value === 'scheduled'
                            && $session->starts_at->isFuture(),
                    )->count(),
                    'report_completion_rate' => $completedSessions->count()
                        ? round(
                            ($completedSessions->filter(fn ($session) => filled($session->teacher_notes))->count()
                                / $completedSessions->count()) * 100,
                            1,
                        )
                        : 0,
                    'month_earnings' => number_format(
                        (float) $earnings
                            ->filter(fn ($earning) => $earning->earned_on->isCurrentMonth())
                            ->filter(fn ($earning) => $earning->status->value !== 'void')
                            ->sum('amount'),
                        2,
                        '.',
                        '',
                    ),
                ],
            ),
            'sessions' => $this->when(
                $this->relationLoaded('teachingSessions'),
                fn () => $sessions->map(fn ($session) => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'status' => $session->status->value,
                    'starts_at' => $session->starts_at?->toIso8601String(),
                    'ends_at' => $session->ends_at?->toIso8601String(),
                    'has_report' => filled($session->teacher_notes),
                    'cohort' => [
                        'id' => $session->cohort->id,
                        'code' => $session->cohort->code,
                        'name' => $session->cohort->name,
                    ],
                ]),
            ),
            'earnings' => $this->when(
                $this->relationLoaded('teacherEarnings'),
                fn () => $earnings->map(fn ($earning) => [
                    'id' => $earning->id,
                    'status' => $earning->status->value,
                    'amount' => $earning->amount,
                    'earned_on' => $earning->earned_on?->toDateString(),
                    'session' => [
                        'id' => $earning->classSession->id,
                        'title' => $earning->classSession->title,
                        'cohort' => $earning->classSession->cohort->name,
                    ],
                ]),
            ),
        ];
    }
}
