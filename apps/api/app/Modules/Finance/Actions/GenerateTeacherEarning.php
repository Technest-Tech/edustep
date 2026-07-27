<?php

namespace App\Modules\Finance\Actions;

use App\Enums\ClassSessionStatus;
use App\Enums\TeacherEarningStatus;
use App\Enums\TeacherRateType;
use App\Models\ClassSession;
use App\Models\TeacherEarning;
use App\Models\TeacherRateRule;

class GenerateTeacherEarning
{
    public function execute(ClassSession $classSession): ?TeacherEarning
    {
        $classSession->loadMissing(['cohort', 'teacher.teacherProfile']);

        if (
            $classSession->status !== ClassSessionStatus::Completed
            || ! $classSession->teacher_id
        ) {
            return null;
        }

        $earnedOn = $classSession->starts_at->toDateString();
        $rateRule = TeacherRateRule::query()
            ->where('teacher_id', $classSession->teacher_id)
            ->where('is_active', true)
            ->whereDate('effective_from', '<=', $earnedOn)
            ->where(function ($query) use ($earnedOn): void {
                $query->whereNull('effective_to')->orWhereDate('effective_to', '>=', $earnedOn);
            })
            ->where(function ($query) use ($classSession): void {
                $query
                    ->whereNull('program_id')
                    ->orWhere('program_id', $classSession->cohort->program_id);
            })
            ->orderByRaw('case when program_id is null then 1 else 0 end')
            ->latest('effective_from')
            ->first();

        $durationMinutes = max(
            1,
            (int) round($classSession->starts_at->diffInSeconds($classSession->ends_at) / 60),
        );
        $rateType = $rateRule?->rate_type ?? TeacherRateType::Hourly;
        $rateAmount = (float) ($rateRule?->amount ?? $classSession->teacher->teacherProfile?->hourly_rate ?? 0);
        $amount = $rateType === TeacherRateType::FixedSession
            ? $rateAmount
            : round($rateAmount * ($durationMinutes / 60), 2);

        return TeacherEarning::query()->firstOrCreate(
            ['class_session_id' => $classSession->id],
            [
                'teacher_id' => $classSession->teacher_id,
                'teacher_rate_rule_id' => $rateRule?->id,
                'status' => TeacherEarningStatus::Pending,
                'duration_minutes' => $durationMinutes,
                'rate_type' => $rateType,
                'rate_amount' => $rateAmount,
                'amount' => $amount,
                'calculation_snapshot' => [
                    'source' => $rateRule ? 'rate_rule' : 'teacher_profile_fallback',
                    'teacher_id' => $classSession->teacher_id,
                    'program_id' => $classSession->cohort->program_id,
                    'session_starts_at' => $classSession->starts_at->toIso8601String(),
                    'duration_minutes' => $durationMinutes,
                    'rate_type' => $rateType->value,
                    'rate_amount' => number_format($rateAmount, 2, '.', ''),
                ],
                'earned_on' => $earnedOn,
            ],
        );
    }
}
