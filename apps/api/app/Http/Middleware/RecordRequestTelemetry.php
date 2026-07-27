<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RecordRequestTelemetry
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);

        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            $this->writeLog($request, $startedAt, 500, 'error');

            throw $exception;
        }

        $durationMs = round((hrtime(true) - $startedAt) / 1_000_000, 2);
        $response->headers->set('X-Response-Time-Ms', (string) $durationMs);

        if ($response->getStatusCode() >= 500) {
            $this->writeLog($request, $startedAt, $response->getStatusCode(), 'error');
        } elseif ($durationMs >= config('operations.telemetry.slow_request_ms')) {
            $this->writeLog($request, $startedAt, $response->getStatusCode(), 'warning');
        }

        return $response;
    }

    private function writeLog(
        Request $request,
        int $startedAt,
        int $status,
        string $level,
    ): void {
        Log::log($level, 'API request telemetry.', [
            'request_id' => $request->attributes->get('request_id'),
            'method' => $request->method(),
            'route_name' => $request->route()?->getName(),
            'path' => $request->path(),
            'status' => $status,
            'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            'actor_id' => $request->user()?->id,
        ]);
    }
}
