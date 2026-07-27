<?php

namespace App\Console\Commands;

use App\Modules\Operations\Actions\VerifyDatabaseBackup;
use Illuminate\Console\Command;
use Throwable;

class VerifyAcademyBackup extends Command
{
    protected $signature = 'academy:backup:verify {path? : Archive or manifest path; defaults to the latest backup}';

    protected $description = 'Verify the checksum and structural integrity of a database backup';

    public function handle(VerifyDatabaseBackup $verify): int
    {
        try {
            $result = $verify->handle($this->argument('path'));
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Backup verification failed. Review the protected application logs.');

            return self::FAILURE;
        }

        $this->info('Backup verification passed.');
        $this->line('Archive: '.$result['archive']);
        $this->line('Verified at: '.$result['verified_at']);

        return self::SUCCESS;
    }
}
