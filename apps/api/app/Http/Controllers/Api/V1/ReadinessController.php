<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\Operations\Actions\CheckSystemReadiness;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadinessController extends Controller
{
    public function __invoke(
        Request $request,
        CheckSystemReadiness $readiness,
    ): JsonResponse {
        $result = $readiness->handle();

        return response()->json([
            'data' => [
                'service' => 'edustep-api',
                'status' => $result['ready'] ? 'ready' : 'not_ready',
                'version' => config('app.version'),
                'checked_at' => $result['checked_at'],
                'checks' => $result['checks'],
            ],
            'meta' => [
                'request_id' => $request->attributes->get('request_id'),
            ],
        ], $result['ready'] ? 200 : 503);
    }
}
