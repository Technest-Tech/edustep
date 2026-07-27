<?php

namespace App\Http\Controllers\Api\V1\Communication;

use App\Http\Controllers\Controller;
use App\Models\GuardianProfile;
use Illuminate\Http\JsonResponse;

class GuardianController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => GuardianProfile::query()
                ->with(['user:id,name,email', 'students:id,student_code,full_name'])
                ->orderBy('created_at')
                ->get()
                ->map(fn (GuardianProfile $guardian) => [
                    'id' => $guardian->id,
                    'name' => $guardian->user?->name,
                    'email' => $guardian->user?->email,
                    'phone' => $guardian->phone,
                    'preferred_channel' => $guardian->preferred_channel,
                    'relationship_label' => $guardian->relationship_label,
                    'students' => $guardian->students->map(fn ($student) => [
                        'id' => $student->id,
                        'student_code' => $student->student_code,
                        'full_name' => $student->full_name,
                        'relationship' => $student->pivot->relationship,
                        'is_primary' => (bool) $student->pivot->is_primary,
                    ])->values(),
                ]),
        ]);
    }
}
