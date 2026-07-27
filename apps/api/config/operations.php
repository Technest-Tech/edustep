<?php

return [
    'readiness' => [
        'scheduler_heartbeat_key' => 'operations:heartbeat:scheduler',
        'queue_heartbeat_key' => 'operations:heartbeat:queue',
        'heartbeat_max_age_seconds' => (int) env('READINESS_HEARTBEAT_MAX_AGE', 180),
        'require_scheduler' => (bool) env('READINESS_REQUIRE_SCHEDULER', false),
        'require_queue' => (bool) env('READINESS_REQUIRE_QUEUE', false),
        'require_backup' => (bool) env('READINESS_REQUIRE_BACKUP', false),
        'backup_max_age_hours' => (int) env('READINESS_BACKUP_MAX_AGE_HOURS', 26),
    ],

    'backups' => [
        'path' => env('BACKUP_PATH', storage_path('app/private/backups')),
        'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),
        'process_timeout_seconds' => (int) env('BACKUP_PROCESS_TIMEOUT', 900),
    ],

    'telemetry' => [
        'slow_request_ms' => (int) env('SLOW_REQUEST_THRESHOLD_MS', 800),
    ],
];
