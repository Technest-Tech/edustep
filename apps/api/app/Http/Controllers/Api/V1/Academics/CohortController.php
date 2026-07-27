<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academics\StoreCohortRequest;
use App\Http\Resources\Api\V1\Academics\CohortDetailResource;
use App\Http\Resources\Api\V1\Academics\CohortResource;
use App\Models\Cohort;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CohortController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Cohort::query()
            ->with(['program', 'level', 'teacher'])
            ->withCount([
                'enrollments' => fn ($query) => $query->where('status', 'active'),
                'seatReservations' => fn ($query) => $query
                    ->where('status', 'held')
                    ->where('reserved_until', '>', now()),
                'waitlistEntries' => fn ($query) => $query->where('status', 'waiting'),
            ])
            ->when(
                $request->user()->role === 'teacher',
                fn ($query) => $query->where('teacher_id', $request->user()->id),
            )
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('program_id')->toString(), fn ($query, string $programId) => $query->where('program_id', $programId))
            ->orderByRaw("case when status = 'active' then 0 when status = 'enrolling' then 1 else 2 end")
            ->orderBy('starts_on');

        return CohortResource::collection($query->get());
    }

    public function store(StoreCohortRequest $request): CohortResource
    {
        $cohort = Cohort::query()->create($request->validated());

        return new CohortResource(
            $cohort
                ->load(['program', 'level', 'teacher'])
                ->loadCount([
                    'enrollments' => fn ($query) => $query->where('status', 'active'),
                    'seatReservations' => fn ($query) => $query
                        ->where('status', 'held')
                        ->where('reserved_until', '>', now()),
                    'waitlistEntries' => fn ($query) => $query->where('status', 'waiting'),
                ]),
        );
    }

    public function show(Request $request, Cohort $cohort): CohortDetailResource
    {
        abort_if(
            $request->user()->role === 'teacher' && $cohort->teacher_id !== $request->user()->id,
            403,
            'لا يمكنك الوصول إلى جروب غير مسند إليك.',
        );

        $cohort->load([
            'program',
            'level',
            'teacher',
            'classSessions' => fn ($query) => $query
                ->with(['teacher', 'attendanceRecords.student'])
                ->latest('starts_at'),
            'enrollments' => fn ($query) => $query
                ->with([
                    'student.progressEntries' => fn ($query) => $query
                        ->with(['level', 'evaluator'])
                        ->latest('occurred_on'),
                ]),
            'waitlistEntries' => fn ($query) => $query
                ->whereIn('status', ['waiting', 'offered'])
                ->with(['lead', 'creator:id,name'])
                ->orderBy('priority')
                ->orderBy('joined_at'),
        ])->loadCount([
            'enrollments' => fn ($query) => $query->where('status', 'active'),
            'seatReservations' => fn ($query) => $query
                ->where('status', 'held')
                ->where('reserved_until', '>', now()),
            'waitlistEntries' => fn ($query) => $query->where('status', 'waiting'),
        ]);

        return new CohortDetailResource($cohort);
    }
}
