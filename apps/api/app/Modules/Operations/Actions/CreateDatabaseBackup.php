<?php

namespace App\Modules\Operations\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use RuntimeException;

class CreateDatabaseBackup
{
    /**
     * @return array<string, mixed>
     */
    public function handle(bool $verify = false): array
    {
        $directory = rtrim(config('operations.backups.path'), DIRECTORY_SEPARATOR);
        File::ensureDirectoryExists($directory, 0750, true);

        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");
        $extension = match ($driver) {
            'sqlite' => 'sqlite',
            'pgsql' => 'dump',
            default => throw new RuntimeException(
                "Database backups are not configured for driver [{$driver}].",
            ),
        };
        $filename = sprintf(
            'edustep-%s-%s-%s.%s',
            $driver,
            now()->utc()->format('Ymd_His'),
            Str::lower(Str::random(6)),
            $extension,
        );
        $archivePath = $directory.DIRECTORY_SEPARATOR.$filename;

        match ($driver) {
            'sqlite' => $this->backupSqlite($connection, $archivePath),
            'pgsql' => $this->backupPostgres($connection, $archivePath),
        };

        if (! File::exists($archivePath) || File::size($archivePath) === 0) {
            throw new RuntimeException('The database backup archive was not created correctly.');
        }

        $manifest = [
            'archive' => $filename,
            'driver' => $driver,
            'connection' => $connection,
            'database' => basename((string) config("database.connections.{$connection}.database")),
            'created_at' => now()->utc()->toIso8601String(),
            'size_bytes' => File::size($archivePath),
            'sha256' => hash_file('sha256', $archivePath),
            'verified_at' => null,
        ];
        $manifestPath = $archivePath.'.manifest.json';
        $this->writeManifest($manifestPath, $manifest);

        if ($verify) {
            $manifest = app(VerifyDatabaseBackup::class)->handle($manifestPath);
        }

        $this->pruneExpiredBackups($directory);

        return [
            ...$manifest,
            'path' => $archivePath,
            'manifest_path' => $manifestPath,
        ];
    }

    private function backupSqlite(string $connection, string $archivePath): void
    {
        $pdo = DB::connection($connection)->getPdo();
        $quotedDestination = $pdo->quote($archivePath);
        $result = $pdo->exec("VACUUM INTO {$quotedDestination}");

        if ($result === false) {
            throw new RuntimeException('SQLite could not create a consistent database snapshot.');
        }
    }

    private function backupPostgres(string $connection, string $archivePath): void
    {
        $database = config("database.connections.{$connection}");
        $result = Process::env([
            'PGPASSWORD' => (string) ($database['password'] ?? ''),
        ])->timeout(config('operations.backups.process_timeout_seconds'))
            ->run([
                'pg_dump',
                '--host',
                (string) $database['host'],
                '--port',
                (string) $database['port'],
                '--username',
                (string) $database['username'],
                '--dbname',
                (string) $database['database'],
                '--format=custom',
                '--compress=9',
                '--no-owner',
                '--no-privileges',
                '--file',
                $archivePath,
            ]);

        if (! $result->successful()) {
            throw new RuntimeException('PostgreSQL backup failed. Review the protected application logs.');
        }
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function writeManifest(string $path, array $manifest): void
    {
        $temporaryPath = $path.'.tmp';
        File::put(
            $temporaryPath,
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        );
        File::move($temporaryPath, $path);
    }

    private function pruneExpiredBackups(string $directory): void
    {
        $retentionDays = config('operations.backups.retention_days');

        if ($retentionDays < 1) {
            return;
        }

        $cutoff = now()->subDays($retentionDays)->getTimestamp();

        foreach (File::glob($directory.DIRECTORY_SEPARATOR.'edustep-*') as $path) {
            if (File::isFile($path) && File::lastModified($path) < $cutoff) {
                File::delete($path);
            }
        }
    }
}
