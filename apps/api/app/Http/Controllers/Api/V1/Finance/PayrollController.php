<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Enums\TeacherEarningStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Finance\TeacherEarningResource;
use App\Models\TeacherEarning;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $from = $request->date('from')?->startOfDay() ?? now()->startOfMonth();
        $to = $request->date('to')?->endOfDay() ?? now()->endOfMonth();

        $earnings = TeacherEarning::query()
            ->with(['teacher:id,name', 'classSession.cohort:id,name,code'])
            ->whereBetween('earned_on', [$from->toDateString(), $to->toDateString()])
            ->latest('earned_on')
            ->get();

        $teachers = $earnings
            ->groupBy('teacher_id')
            ->map(fn ($items) => [
                'teacher' => [
                    'id' => $items->first()->teacher->id,
                    'name' => $items->first()->teacher->name,
                ],
                'sessions' => $items->count(),
                'pending' => number_format(
                    (float) $items->where('status', TeacherEarningStatus::Pending)->sum('amount'),
                    2,
                    '.',
                    '',
                ),
                'approved' => number_format(
                    (float) $items->where('status', TeacherEarningStatus::Approved)->sum('amount'),
                    2,
                    '.',
                    '',
                ),
                'paid' => number_format(
                    (float) $items->where('status', TeacherEarningStatus::Paid)->sum('amount'),
                    2,
                    '.',
                    '',
                ),
                'total' => number_format(
                    (float) $items->where('status', '!=', TeacherEarningStatus::Void)->sum('amount'),
                    2,
                    '.',
                    '',
                ),
            ])
            ->values();

        return response()->json([
            'data' => [
                'range' => [
                    'from' => Carbon::parse($from)->toDateString(),
                    'to' => Carbon::parse($to)->toDateString(),
                ],
                'summary' => [
                    'sessions' => $earnings->count(),
                    'pending' => $this->sumByStatus($earnings, TeacherEarningStatus::Pending),
                    'approved' => $this->sumByStatus($earnings, TeacherEarningStatus::Approved),
                    'paid' => $this->sumByStatus($earnings, TeacherEarningStatus::Paid),
                    'total' => number_format(
                        (float) $earnings->where('status', '!=', TeacherEarningStatus::Void)->sum('amount'),
                        2,
                        '.',
                        '',
                    ),
                    'missing_rates' => $earnings->where('rate_amount', '0.00')->count(),
                ],
                'teachers' => $teachers,
                'earnings' => TeacherEarningResource::collection($earnings),
            ],
        ]);
    }

    private function sumByStatus($earnings, TeacherEarningStatus $status): string
    {
        return number_format(
            (float) $earnings->where('status', $status)->sum('amount'),
            2,
            '.',
            '',
        );
    }
}
