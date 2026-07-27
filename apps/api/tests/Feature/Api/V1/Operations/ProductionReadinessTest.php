<?php

namespace Tests\Feature\Api\V1\Operations;

use App\Jobs\RecordQueueHeartbeat;
use App\Modules\Operations\Actions\RecordOperationsHeartbeat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    private string $backupPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->backupPath = sys_get_temp_dir().'/edustep-backup-test-'.Str::uuid();
        config()->set('operations.backups.path', $this->backupPath);
        config()->set('operations.readiness.require_scheduler', false);
        config()->set('operations.readiness.require_queue', false);
        config()->set('operations.readiness.require_backup', false);
        Cache::flush();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->backupPath);

        parent::tearDown();
    }

    public function test_readiness_reports_core_dependencies_and_response_telemetry(): void
    {
        $this->getJson('/api/v1/readiness')
            ->assertOk()
            ->assertHeader('X-Request-Id')
            ->assertHeader('X-Response-Time-Ms')
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.checks.database.status', 'ok')
            ->assertJsonPath('data.checks.cache.status', 'ok')
            ->assertJsonPath('data.checks.storage.status', 'ok')
            ->assertJsonPath('data.checks.scheduler.status', 'skipped')
            ->assertJsonPath('data.checks.queue.status', 'skipped')
            ->assertJsonPath('data.checks.backup.status', 'skipped');
    }

    public function test_required_heartbeats_fail_closed_until_scheduler_and_worker_respond(): void
    {
        config()->set('operations.readiness.require_scheduler', true);
        config()->set('operations.readiness.require_queue', true);

        $this->getJson('/api/v1/readiness')
            ->assertServiceUnavailable()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.checks.scheduler.status', 'failed')
            ->assertJsonPath('data.checks.queue.status', 'failed');

        app(RecordOperationsHeartbeat::class)->handle('scheduler');
        app(RecordQueueHeartbeat::class)->handle(
            app(RecordOperationsHeartbeat::class),
        );

        $this->getJson('/api/v1/readiness')
            ->assertOk()
            ->assertJsonPath('data.checks.scheduler.status', 'ok')
            ->assertJsonPath('data.checks.queue.status', 'ok');
    }

    public function test_database_backup_is_created_checksummed_and_verified(): void
    {
        $this->artisan('academy:backup', ['--verify' => true])
            ->expectsOutput('Database backup created successfully.')
            ->assertSuccessful();

        $manifestPath = collect(
            File::glob($this->backupPath.'/*.manifest.json'),
        )->first();

        $this->assertNotNull($manifestPath);
        $manifest = json_decode((string) File::get($manifestPath), true);
        $archivePath = $this->backupPath.'/'.$manifest['archive'];

        $this->assertFileExists($archivePath);
        $this->assertSame('passed', $manifest['verification']);
        $this->assertNotNull($manifest['verified_at']);
        $this->assertSame(hash_file('sha256', $archivePath), $manifest['sha256']);

        config()->set('operations.readiness.require_backup', true);

        $this->getJson('/api/v1/readiness')
            ->assertOk()
            ->assertJsonPath('data.checks.backup.status', 'ok');
    }

    public function test_backup_verification_detects_archive_tampering(): void
    {
        $this->artisan('academy:backup')->assertSuccessful();

        $manifestPath = collect(
            File::glob($this->backupPath.'/*.manifest.json'),
        )->first();
        $manifest = json_decode((string) File::get($manifestPath), true);
        $archivePath = $this->backupPath.'/'.$manifest['archive'];
        File::append($archivePath, 'tampered');

        $this->artisan('academy:backup:verify', [
            'path' => $manifestPath,
        ])->assertFailed();
    }
}
