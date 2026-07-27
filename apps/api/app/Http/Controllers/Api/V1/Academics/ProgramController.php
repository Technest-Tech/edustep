<?php

namespace App\Http\Controllers\Api\V1\Academics;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Academics\ProgramResource;
use App\Models\Program;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProgramController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ProgramResource::collection(
            Program::query()
                ->where('is_active', true)
                ->with(['levels' => fn ($query) => $query->where('is_active', true)])
                ->orderBy('name_ar')
                ->get(),
        );
    }
}
