<?php

namespace App\Jobs;

use App\Modules\Operations\Actions\RecordOperationsHeartbeat;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecordQueueHeartbeat implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 30;

    public function handle(RecordOperationsHeartbeat $heartbeat): void
    {
        $heartbeat->handle('queue');
    }
}
