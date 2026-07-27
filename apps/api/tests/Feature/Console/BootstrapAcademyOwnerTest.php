<?php

namespace Tests\Feature\Console;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BootstrapAcademyOwnerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_securely_creates_the_first_owner(): void
    {
        $this->artisan('academy:bootstrap-owner', [
            '--name' => 'Ahmed Omar',
            '--email' => 'OWNER@EXAMPLE.COM',
        ])
            ->expectsQuestion('Owner password', 'Owner@Secure123')
            ->expectsQuestion('Confirm owner password', 'Owner@Secure123')
            ->assertSuccessful();

        $owner = User::query()->sole();

        $this->assertSame('owner@example.com', $owner->email);
        $this->assertSame('owner', $owner->role);
        $this->assertSame('active', $owner->status);
        $this->assertFalse($owner->must_change_password);
        $this->assertNotNull($owner->password_changed_at);
        $this->assertNotNull($owner->email_verified_at);
    }

    public function test_it_refuses_to_create_a_second_owner(): void
    {
        User::factory()->create(['role' => 'owner']);

        $this->artisan('academy:bootstrap-owner', [
            '--name' => 'Another Owner',
            '--email' => 'another@example.com',
        ])->assertFailed();

        $this->assertDatabaseCount('users', 1);
    }
}
