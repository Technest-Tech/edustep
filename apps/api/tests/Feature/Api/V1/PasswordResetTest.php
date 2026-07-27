<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Notifications\ResetAccountPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost');
    }

    public function test_reset_link_response_does_not_reveal_whether_account_exists(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk()
            ->assertJsonStructure(['data' => ['message']]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'unknown@example.com',
        ])->assertOk()
            ->assertJsonStructure(['data' => ['message']]);

        Notification::assertSentTo($user, ResetAccountPassword::class);
    }

    public function test_valid_token_resets_password_and_revokes_existing_access(): void
    {
        $user = User::factory()->create([
            'password' => 'OldPassword@123',
            'must_change_password' => true,
        ]);
        $token = Password::broker()->createToken($user);
        $user->createToken('old-access');
        DB::table('sessions')->insert([
            'id' => 'old-browser-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Chrome',
            'payload' => 'payload',
            'last_activity' => now()->getTimestamp(),
        ]);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewPassword@123',
            'password_confirmation' => 'NewPassword@123',
        ])->assertOk();

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword@123', $user->password));
        $this->assertFalse($user->must_change_password);
        $this->assertNotNull($user->password_changed_at);
        $this->assertDatabaseMissing('sessions', ['id' => 'old-browser-session']);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'security.password_reset',
            'auditable_id' => $user->id,
        ]);
    }
}
