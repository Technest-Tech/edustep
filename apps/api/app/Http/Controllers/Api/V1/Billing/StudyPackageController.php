<?php

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Billing\StoreStudyPackageRequest;
use App\Http\Resources\Api\V1\Billing\StudyPackageResource;
use App\Models\StudyPackage;

class StudyPackageController extends Controller
{
    public function store(StoreStudyPackageRequest $request): StudyPackageResource
    {
        $package = StudyPackage::query()->create($request->validated());

        return new StudyPackageResource(
            $package->load(['program', 'level'])->loadCount('subscriptions'),
        );
    }
}
