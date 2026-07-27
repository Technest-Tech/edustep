<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Enums\ClassSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Academics\ClassSessionResource;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CalendarController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'teacher_id' => ['nullable', 'ulid', 'exists:users,id'],
            'cohort_id' => ['nullable', 'ulid', 'exists:cohorts,id'],
            'status' => ['nullable', 'string'],
        ]);

        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'])->startOfDay()
            : now()->startOfWeek()->startOfDay();
        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])->endOfDay()
            : $from->copy()->addDays(6)->endOfDay();

        if ($from->diffInDays($to) > 62) {
            throw ValidationException::withMessages([
                'to' => 'يمكن عرض 63 يومًا كحد أقصى في المرة الواحدة.',
            ]);
        }

        $user = $request->user();
        $teacherId = $user->role === 'teacher'
            ? $user->id
            : ($validated['teacher_id'] ?? null);

        $sessions = ClassSession::query()
            ->with([
                'teacher:id,name',
                'cohort.program:id,name_ar',
                'cohort.level:id,name_ar',
                'attendanceRecords:id,class_session_id,status',
                'teacherEarning:id,class_session_id,status,amount',
            ])
            ->whereBetween('starts_at', [$from, $to])
            ->when($teacherId, fn ($query) => $query->where('teacher_id', $teacherId))
            ->when($validated['cohort_id'] ?? null, fn ($query, string $cohortId) => $query->where('cohort_id', $cohortId))
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->orderBy('starts_at')
            ->get();

        return response()->json([
            'data' => [
                'range' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'summary' => [
                    'total' => $sessions->count(),
                    'scheduled' => $sessions->where('status', ClassSessionStatus::Scheduled)->count(),
                    'completed' => $sessions->where('status', ClassSessionStatus::Completed)->count(),
                    'cancelled' => $sessions->where('status', ClassSessionStatus::Cancelled)->count(),
                    'teaching_minutes' => (int) $sessions
                        ->where('status', '!=', ClassSessionStatus::Cancelled)
                        ->sum(fn (ClassSession $session) => $session->starts_at->diffInMinutes($session->ends_at)),
                ],
                'sessions' => ClassSessionResource::collection($sessions),
            ],
        ]);
    }
}
