<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Enums\TeacherEarningStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Finance\TeacherEarningResource;
use App\Models\TeacherEarning;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherEarningsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $from = $request->date('from')?->startOfDay() ?? now()->startOfMonth();
        $to = $request->date('to')?->endOfDay() ?? now()->endOfMonth();
        $earnings = TeacherEarning::query()
            ->with(['teacher:id,name', 'classSession.cohort:id,name,code'])
            ->where('teacher_id', $request->user()->id)
            ->whereBetween('earned_on', [$from->toDateString(), $to->toDateString()])
            ->latest('earned_on')
            ->get();

        $sum = fn (TeacherEarningStatus $status): string => number_format(
            (float) $earnings->where('status', $status)->sum('amount'),
            2,
            '.',
            '',
        );

        return response()->json([
            'data' => [
                'range' => [
                    'from' => Carbon::parse($from)->toDateString(),
                    'to' => Carbon::parse($to)->toDateString(),
                ],
                'summary' => [
                    'sessions' => $earnings->count(),
                    'pending' => $sum(TeacherEarningStatus::Pending),
                    'approved' => $sum(TeacherEarningStatus::Approved),
                    'paid' => $sum(TeacherEarningStatus::Paid),
                    'total' => number_format(
                        (float) $earnings->where('status', '!=', TeacherEarningStatus::Void)->sum('amount'),
                        2,
                        '.',
                        '',
                    ),
                ],
                'earnings' => TeacherEarningResource::collection($earnings)->resolve($request),
            ],
        ]);
    }
}
