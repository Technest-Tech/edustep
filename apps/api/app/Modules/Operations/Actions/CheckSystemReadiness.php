<?php

namespace App\Modules\Operations\Actions;

use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class CheckSystemReadiness
{
    /**
     * @return array{ready: bool, checked_at: string, checks: array<string, array<string, mixed>>}
     */
    public function handle(bool $coreOnly = false): array
    {
        $checks = [
            'database' => $this->probe(function (): void {
                DB::select('select 1');
            }),
            'cache' => $this->probe(function (): void {
                $key = 'operations:readiness:'.Str::uuid();
                Cache::put($key, 'ready', 10);

                if (Cache::get($key) !== 'ready') {
                    throw new RuntimeException('Cache probe did not return the stored value.');
                }

                Cache::forget($key);
            }),
            'storage' => $this->probe(function (): void {
                $path = storage_path('app/private');

                if (! File::isDirectory($path) || ! File::isWritable($path)) {
                    throw new RuntimeException('Private storage is not writable.');
                }
            }),
            'scheduler' => $this->heartbeatCheck(
                config('operations.readiness.scheduler_heartbeat_key'),
                ! $coreOnly && config('operations.readiness.require_scheduler'),
            ),
            'queue' => $this->heartbeatCheck(
                config('operations.readiness.queue_heartbeat_key'),
                ! $coreOnly && config('operations.readiness.require_queue'),
            ),
            'backup' => $this->backupCheck(
                ! $coreOnly && config('operations.readiness.require_backup'),
            ),
        ];

        return [
            'ready' => collect($checks)->every(
                fn (array $check) => ! $check['required'] || $check['status'] === 'ok',
            ),
            'checked_at' => now()->toIso8601String(),
            'checks' => $checks,
        ];
    }

    /**
     * @return array{status: string, required: bool, latency_ms: float}
     */
    private function probe(Closure $callback): array
    {
        $startedAt = hrtime(true);

        try {
            $callback();

            return [
                'status' => 'ok',
                'required' => true,
                'latency_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ];
        } catch (Throwable) {
            return [
                'status' => 'failed',
                'required' => true,
                'latency_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ];
        }
    }

    /**
     * @return array{status: string, required: bool, age_seconds: int|null}
     */
    private function heartbeatCheck(string $key, bool $required): array
    {
        $recordedAt = Cache::get($key);

        if (! is_numeric($recordedAt)) {
            return [
                'status' => $required ? 'failed' : 'skipped',
                'required' => $required,
                'age_seconds' => null,
            ];
        }

        $age = max(0, now()->getTimestamp() - (int) $recordedAt);
        $fresh = $age <= config('operations.readiness.heartbeat_max_age_seconds');

        return [
            'status' => $fresh ? 'ok' : ($required ? 'failed' : 'stale'),
            'required' => $required,
            'age_seconds' => $age,
        ];
    }

    /**
     * @return array{status: string, required: bool, age_hours: float|null, verified_at: string|null}
     */
    private function backupCheck(bool $required): array
    {
        $backupPath = rtrim(config('operations.backups.path'), DIRECTORY_SEPARATOR);
        $manifestPath = collect(File::glob(
            $backupPath.DIRECTORY_SEPARATOR.'*.manifest.json',
        ))->sortByDesc(fn (string $path) => File::lastModified($path))->first();

        if (! $manifestPath) {
            return [
                'status' => $required ? 'failed' : 'skipped',
                'required' => $required,
                'age_hours' => null,
                'verified_at' => null,
            ];
        }

        $manifest = json_decode((string) File::get($manifestPath), true);
        $createdAt = isset($manifest['created_at']) ? strtotime($manifest['created_at']) : false;
        $verifiedAt = $manifest['verified_at'] ?? null;
        $ageHours = $createdAt === false
            ? null
            : round(max(0, now()->getTimestamp() - $createdAt) / 3600, 2);
        $fresh = $ageHours !== null
            && $ageHours <= config('operations.readiness.backup_max_age_hours')
            && filled($verifiedAt)
            && isset($manifest['archive'])
            && File::exists($backupPath.DIRECTORY_SEPARATOR.$manifest['archive']);

        return [
            'status' => $fresh ? 'ok' : ($required ? 'failed' : 'stale'),
            'required' => $required,
            'age_hours' => $ageHours,
            'verified_at' => $verifiedAt,
        ];
    }
}
