<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academics\RecordAttendanceRequest;
use App\Http\Resources\Api\V1\Academics\ClassSessionResource;
use App\Models\ClassSession;
use App\Modules\Academics\Actions\RecordSessionAttendance;

class AttendanceController extends Controller
{
    public function update(
        RecordAttendanceRequest $request,
        ClassSession $classSession,
        RecordSessionAttendance $recordAttendance,
    ): ClassSessionResource {
        abort_if(
            $request->user()->role === 'teacher' && $classSession->teacher_id !== $request->user()->id,
            403,
            'لا يمكنك تسجيل حضور حصة غير مسندة إليك.',
        );

        $data = $request->validated();

        return new ClassSessionResource(
            $recordAttendance->execute(
                $classSession,
                $data['records'],
                $request->user(),
                $data['complete_session'] ?? false,
                $data['teacher_notes'] ?? null,
            ),
        );
    }
}
