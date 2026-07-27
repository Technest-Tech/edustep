<?php

namespace App\Modules\Operations\Actions;

use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

class RecordOperationsHeartbeat
{
    public function handle(string $component): void
    {
        $key = match ($component) {
            'scheduler' => config('operations.readiness.scheduler_heartbeat_key'),
            'queue' => config('operations.readiness.queue_heartbeat_key'),
            default => throw new InvalidArgumentException("Unknown operations component [{$component}]."),
        };

        Cache::put($key, now()->getTimestamp(), now()->addMinutes(10));
    }
}
