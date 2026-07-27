<?php

namespace App\Console\Commands;

use App\Modules\Operations\Actions\CheckSystemReadiness;
use Illuminate\Console\Command;

class CheckOperationsReadiness extends Command
{
    protected $signature = 'operations:check {--core : Check only database, cache, and storage}';

    protected $description = 'Verify that the application and its required operational dependencies are ready';

    public function handle(CheckSystemReadiness $readiness): int
    {
        $result = $readiness->handle($this->option('core'));

        if (! $this->option('quiet')) {
            $this->table(
                ['Component', 'Status', 'Required'],
                collect($result['checks'])
                    ->map(fn (array $check, string $name) => [
                        $name,
                        $check['status'],
                        $check['required'] ? 'yes' : 'no',
                    ])
                    ->values()
                    ->all(),
            );
        }

        return $result['ready'] ? self::SUCCESS : self::FAILURE;
    }
}
