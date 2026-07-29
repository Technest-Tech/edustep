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
                ->with([
                    'levels' => fn ($query) => $query
                        ->where('is_active', true)
                        ->with([
                            'studyPackages' => fn ($query) => $query
                                ->where('is_active', true)
                                ->orderBy('price'),
                        ]),
                ])
                ->orderByRaw('case when catalog_version = ? then 0 else 1 end', ['intensive-v1.1'])
                ->orderBy('age_min')
                ->orderBy('name_ar')
                ->get(),
        );
    }
}
