<?php

namespace App\Http\Controllers\Api\V1\Family;

use App\Enums\ServiceRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Family\StoreFamilyServiceRequest;
use App\Http\Requests\Api\V1\Family\UpdateFamilyServiceRequest;
use App\Http\Resources\Api\V1\Family\FamilyServiceRequestResource;
use App\Models\FamilyServiceRequest;
use App\Models\GuardianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FamilyServiceRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = FamilyServiceRequest::query()
            ->with(['guardian.user:id,name', 'student:id,student_code,full_name', 'assignee:id,name'])
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('category')->toString(), fn ($query, string $category) => $query->where('category', $category))
            ->latest()
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'total' => $requests->count(),
                    'open' => $requests->where('status', ServiceRequestStatus::Open)->count(),
                    'in_progress' => $requests->where('status', ServiceRequestStatus::InProgress)->count(),
                    'urgent' => $requests
                        ->whereIn('priority', ['high', 'urgent'])
                        ->whereNotIn('status', [ServiceRequestStatus::Resolved, ServiceRequestStatus::Closed])
                        ->count(),
                ],
                'requests' => FamilyServiceRequestResource::collection($requests)->resolve($request),
            ],
        ]);
    }

    public function store(
        StoreFamilyServiceRequest $request,
    ): FamilyServiceRequestResource {
        $guardian = GuardianProfile::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
        $studentId = $request->validated('student_id');

        abort_if(
            $studentId && ! $guardian->students()->whereKey($studentId)->exists(),
            403,
            'لا يمكنك إنشاء طلب لطالب غير مرتبط بحسابك.',
        );

        $serviceRequest = $guardian->serviceRequests()->create([
            ...$request->validated(),
            'request_number' => 'REQ-'.now()->format('Y').'-'.Str::upper(Str::random(6)),
            'priority' => $request->validated('priority') ?? 'normal',
            'status' => ServiceRequestStatus::Open,
        ]);

        return new FamilyServiceRequestResource(
            $serviceRequest->load(['guardian.user', 'student', 'assignee']),
        );
    }

    public function update(
        UpdateFamilyServiceRequest $request,
        FamilyServiceRequest $familyServiceRequest,
    ): FamilyServiceRequestResource {
        $data = $request->validated();
        $data['resolved_at'] = in_array(
            $data['status'],
            [ServiceRequestStatus::Resolved->value, ServiceRequestStatus::Closed->value],
            true,
        ) ? now() : null;
        $familyServiceRequest->update($data);

        return new FamilyServiceRequestResource(
            $familyServiceRequest->fresh()->load(['guardian.user', 'student', 'assignee']),
        );
    }
}
