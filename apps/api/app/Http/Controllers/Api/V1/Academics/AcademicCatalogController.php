<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Academics\ProgramResource;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicCatalogController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $programs = Program::query()
            ->where('is_active', true)
            ->where('catalog_version', 'intensive-v1.1')
            ->with([
                'levels' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with([
                        'curriculumStage.units',
                        'studyPackages' => fn ($query) => $query
                            ->where('is_active', true)
                            ->where('source_version', 'intensive-v1.1')
                            ->orderBy('price'),
                    ]),
            ])
            ->orderBy('age_min')
            ->get();

        return response()->json([
            'data' => [
                'version' => 'intensive-v1.1',
                'policy' => [
                    'duration_weeks' => 8,
                    'sessions_count' => 16,
                    'sessions_per_week' => 2,
                    'teaching_blocks_count' => 4,
                    'source_curriculum_units_count' => 6,
                    'full_payment_discount_percent' => 5,
                    'default_installments' => 2,
                    'second_installment_session' => 9,
                    'second_installment_due_days_before' => 2,
                    'promotion_score_percent' => 70,
                    'promotion_attendance_percent' => 80,
                ],
                'programs' => ProgramResource::collection($programs)->resolve($request),
            ],
        ]);
    }
}
