<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Academics\StoreAcademyClosureRequest;
use App\Models\AcademyClosure;
use Illuminate\Http\JsonResponse;

class AcademyClosureController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => AcademyClosure::query()
                ->with('creator:id,name')
                ->orderBy('starts_on')
                ->get()
                ->map(fn (AcademyClosure $closure) => $this->payload($closure)),
        ]);
    }

    public function store(StoreAcademyClosureRequest $request): JsonResponse
    {
        $closure = AcademyClosure::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'data' => $this->payload($closure->load('creator:id,name')),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(AcademyClosure $closure): array
    {
        return [
            'id' => $closure->id,
            'name' => $closure->name,
            'starts_on' => $closure->starts_on->toDateString(),
            'ends_on' => $closure->ends_on->toDateString(),
            'affects_online' => $closure->affects_online,
            'reason' => $closure->reason,
            'creator' => $closure->creator ? [
                'id' => $closure->creator->id,
                'name' => $closure->creator->name,
            ] : null,
        ];
    }
}
