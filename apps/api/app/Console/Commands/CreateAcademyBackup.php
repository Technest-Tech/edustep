<?php

namespace App\Console\Commands;

use App\Modules\Operations\Actions\CreateDatabaseBackup;
use Illuminate\Console\Command;
use Throwable;

class CreateAcademyBackup extends Command
{
    protected $signature = 'academy:backup {--verify : Verify the archive immediately after creation}';

    protected $description = 'Create a private, checksummed database backup archive';

    public function handle(CreateDatabaseBackup $backup): int
    {
        try {
            $result = $backup->handle($this->option('verify'));
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Database backup failed. Review the protected application logs.');

            return self::FAILURE;
        }

        $this->info('Database backup created successfully.');
        $this->line('Archive: '.basename($result['path']));
        $this->line('Verified: '.($result['verified_at'] ? 'yes' : 'no'));

        return self::SUCCESS;
    }
}
