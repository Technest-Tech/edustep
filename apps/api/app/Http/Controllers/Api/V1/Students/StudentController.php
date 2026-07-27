<?php

namespace App\Http\Controllers\Api\V1\Students;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Students\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Student::query()
            ->with(['enrollments.cohort.level'])
            ->when(
                $request->user()->role === 'teacher',
                fn ($query) => $query->whereHas(
                    'enrollments.cohort',
                    fn ($query) => $query->where('teacher_id', $request->user()->id),
                ),
            )
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('student_code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->latest();

        return StudentResource::collection(
            $query->paginate(min(max($request->integer('per_page', 20), 5), 100)),
        );
    }

    public function show(Request $request, Student $student): StudentResource
    {
        abort_if(
            $request->user()->role === 'teacher'
                && ! $student->enrollments()
                    ->whereHas('cohort', fn ($query) => $query->where('teacher_id', $request->user()->id))
                    ->exists(),
            403,
            'لا يمكنك الوصول إلى طالب خارج جروباتك.',
        );

        return new StudentResource(
            $student->load([
                'enrollments.cohort.level',
                'enrollments.cohort.program',
                'attendanceRecords.classSession',
                'progressEntries' => fn ($query) => $query
                    ->with(['level', 'evaluator'])
                    ->latest('occurred_on'),
            ]),
        );
    }
}
