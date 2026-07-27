<?php

namespace App\Modules\Operations\Actions;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use PDO;
use RuntimeException;

class VerifyDatabaseBackup
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?string $path = null): array
    {
        $directory = rtrim(config('operations.backups.path'), DIRECTORY_SEPARATOR);
        $manifestPath = $this->resolveManifestPath($directory, $path);
        $manifest = json_decode((string) File::get($manifestPath), true);

        if (! is_array($manifest) || ! isset($manifest['archive'], $manifest['driver'], $manifest['sha256'])) {
            throw new RuntimeException('The backup manifest is invalid.');
        }

        $archivePath = $directory.DIRECTORY_SEPARATOR.basename($manifest['archive']);

        if (! File::exists($archivePath)) {
            throw new RuntimeException('The backup archive referenced by the manifest is missing.');
        }

        if (! hash_equals($manifest['sha256'], hash_file('sha256', $archivePath))) {
            throw new RuntimeException('The backup checksum does not match its manifest.');
        }

        match ($manifest['driver']) {
            'sqlite' => $this->verifySqlite($archivePath),
            'pgsql' => $this->verifyPostgres($archivePath),
            default => throw new RuntimeException('The backup driver cannot be verified.'),
        };

        $manifest['verified_at'] = now()->utc()->toIso8601String();
        $manifest['verification'] = 'passed';
        $temporaryPath = $manifestPath.'.tmp';
        File::put(
            $temporaryPath,
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        );
        File::move($temporaryPath, $manifestPath);

        return $manifest;
    }

    private function resolveManifestPath(string $directory, ?string $path): string
    {
        if ($path) {
            $candidate = str_ends_with($path, '.manifest.json')
                ? $path
                : $path.'.manifest.json';
            $candidate = str_starts_with($candidate, DIRECTORY_SEPARATOR)
                ? $candidate
                : $directory.DIRECTORY_SEPARATOR.basename($candidate);

            if (! File::exists($candidate)) {
                throw new RuntimeException('The requested backup manifest does not exist.');
            }

            return $candidate;
        }

        $latest = collect(
            File::glob($directory.DIRECTORY_SEPARATOR.'*.manifest.json'),
        )->sortByDesc(fn (string $manifest) => File::lastModified($manifest))->first();

        if (! $latest) {
            throw new RuntimeException('No database backup manifest is available.');
        }

        return $latest;
    }

    private function verifySqlite(string $archivePath): void
    {
        $database = new PDO('sqlite:'.$archivePath);
        $result = $database->query('PRAGMA integrity_check')->fetchColumn();

        if ($result !== 'ok') {
            throw new RuntimeException('SQLite integrity verification failed.');
        }
    }

    private function verifyPostgres(string $archivePath): void
    {
        $result = Process::timeout(config('operations.backups.process_timeout_seconds'))
            ->run(['pg_restore', '--list', $archivePath]);

        if (! $result->successful() || blank($result->output())) {
            throw new RuntimeException('PostgreSQL archive verification failed.');
        }
    }
}
