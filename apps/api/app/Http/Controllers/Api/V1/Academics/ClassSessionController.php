<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Enums\ClassSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academics\StoreClassSessionRequest;
use App\Http\Requests\Api\V1\Academics\UpdateClassSessionRequest;
use App\Http\Resources\Api\V1\Academics\ClassSessionResource;
use App\Models\ClassSession;
use App\Models\Cohort;
use App\Modules\Academics\Actions\EnsureSessionAvailability;
use App\Modules\Finance\Actions\GenerateTeacherEarning;
use Carbon\Carbon;

class ClassSessionController extends Controller
{
    public function store(
        StoreClassSessionRequest $request,
        Cohort $cohort,
        EnsureSessionAvailability $ensureAvailability,
    ): ClassSessionResource {
        abort_if(
            $request->user()->role === 'teacher' && $cohort->teacher_id !== $request->user()->id,
            403,
            'لا يمكنك إدارة حصص جروب غير مسند إليك.',
        );

        $data = $request->validated();
        $data['teacher_id'] = $request->user()->role === 'teacher'
            ? $request->user()->id
            : ($data['teacher_id'] ?? $cohort->teacher_id);
        $data['status'] ??= ClassSessionStatus::Scheduled;
        $data['room_name'] ??= $cohort->room_name;
        $data['meeting_url'] ??= $cohort->meeting_url;

        $ensureAvailability->execute(
            $data['teacher_id'],
            $data['room_name'] ?? null,
            Carbon::parse($data['starts_at']),
            Carbon::parse($data['ends_at']),
        );

        $classSession = $cohort->classSessions()->create($data);

        return new ClassSessionResource(
            $classSession->load(['teacher', 'attendanceRecords.student']),
        );
    }

    public function update(
        UpdateClassSessionRequest $request,
        ClassSession $classSession,
        EnsureSessionAvailability $ensureAvailability,
        GenerateTeacherEarning $generateTeacherEarning,
    ): ClassSessionResource {
        abort_if(
            $request->user()->role === 'teacher' && $classSession->teacher_id !== $request->user()->id,
            403,
            'لا يمكنك تعديل حصة غير مسندة إليك.',
        );

        $data = $request->validated();
        if ($request->user()->role === 'teacher') {
            unset($data['teacher_id']);
        }
        $startsAt = Carbon::parse($data['starts_at'] ?? $classSession->starts_at);
        $endsAt = Carbon::parse($data['ends_at'] ?? $classSession->ends_at);

        if (isset($data['starts_at']) || isset($data['ends_at']) || isset($data['teacher_id']) || isset($data['room_name'])) {
            $ensureAvailability->execute(
                $data['teacher_id'] ?? $classSession->teacher_id,
                $data['room_name'] ?? $classSession->room_name,
                $startsAt,
                $endsAt,
                $classSession->id,
            );
        }

        if (($data['status'] ?? null) === ClassSessionStatus::Completed->value) {
            $data['completed_at'] = now();
        }

        $classSession->update($data);

        if ($classSession->status === ClassSessionStatus::Completed) {
            $generateTeacherEarning->execute($classSession);
        }

        return new ClassSessionResource(
            $classSession->load(['teacher', 'attendanceRecords.student']),
        );
    }
}
