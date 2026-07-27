<?php

use App\Jobs\RecordQueueHeartbeat;
use App\Modules\Operations\Actions\RecordOperationsHeartbeat;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(
    fn () => app(RecordOperationsHeartbeat::class)->handle('scheduler'),
)->name('operations.scheduler-heartbeat')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::job(new RecordQueueHeartbeat, 'default')
    ->name('operations.queue-heartbeat')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('academy:backup --verify')
    ->name('operations.daily-database-backup')
    ->dailyAt('02:00')
    ->withoutOverlapping(120)
    ->onOneServer();
