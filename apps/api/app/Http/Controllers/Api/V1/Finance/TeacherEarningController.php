<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Enums\TeacherEarningStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Finance\UpdateTeacherEarningStatusRequest;
use App\Http\Resources\Api\V1\Finance\TeacherEarningResource;
use App\Models\TeacherEarning;
use Illuminate\Validation\ValidationException;

class TeacherEarningController extends Controller
{
    public function updateStatus(
        UpdateTeacherEarningStatusRequest $request,
        TeacherEarning $teacherEarning,
    ): TeacherEarningResource {
        $status = TeacherEarningStatus::from($request->validated('status'));
        $user = $request->user();

        if (
            in_array($status, [TeacherEarningStatus::Approved, TeacherEarningStatus::Void], true)
            && $user->role !== 'owner'
        ) {
            abort(403, 'اعتماد أو إلغاء المستحق يتطلب صلاحية مدير الأكاديمية.');
        }

        if (
            $status === TeacherEarningStatus::Paid
            && $teacherEarning->status !== TeacherEarningStatus::Approved
        ) {
            throw ValidationException::withMessages([
                'status' => 'يجب اعتماد المستحق قبل تسجيل دفعه.',
            ]);
        }

        $data = ['status' => $status];

        if ($status === TeacherEarningStatus::Approved) {
            $data['approved_by'] = $user->id;
            $data['approved_at'] = now();
        }

        if ($status === TeacherEarningStatus::Paid) {
            $data['paid_at'] = now();
        }

        $teacherEarning->update($data);

        return new TeacherEarningResource(
            $teacherEarning->fresh()->load(['teacher:id,name', 'classSession.cohort:id,name,code']),
        );
    }
}
