<?php

namespace App\Http\Controllers\Api\V1\People;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\People\TeacherResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TeacherController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TeacherResource::collection(
            User::query()
                ->where('role', 'teacher')
                ->with([
                    'teacherProfile',
                    'teachingCohorts' => fn ($query) => $query
                        ->with(['program', 'level', 'enrollments'])
                        ->latest('starts_on'),
                ])
                ->withCount([
                    'teachingCohorts' => fn ($query) => $query->whereIn('status', ['active', 'enrolling']),
                ])
                ->orderBy('name')
                ->get(),
        );
    }

    public function show(User $teacher): TeacherResource
    {
        abort_unless($teacher->role === 'teacher', 404);

        $teacher
            ->load([
                'teacherProfile',
                'teachingCohorts' => fn ($query) => $query
                    ->with(['program', 'level', 'enrollments'])
                    ->latest('starts_on'),
                'teachingSessions' => fn ($query) => $query
                    ->with(['cohort:id,name,code'])
                    ->latest('starts_at')
                    ->limit(20),
                'teacherEarnings' => fn ($query) => $query
                    ->with('classSession.cohort:id,name,code')
                    ->latest('earned_on')
                    ->limit(20),
            ])
            ->loadCount([
                'teachingCohorts' => fn ($query) => $query->whereIn('status', ['active', 'enrolling']),
            ]);

        return new TeacherResource($teacher);
    }
}
