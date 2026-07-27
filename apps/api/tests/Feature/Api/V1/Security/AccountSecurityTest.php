<?php

namespace Tests\Feature\Api\V1\Security;

use App\Models\User;
use App\Modules\Security\Actions\TotpAuthenticator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost');
    }

    public function test_privileged_account_is_limited_to_security_center_until_two_factor_is_enabled(): void
    {
        config()->set('security.require_privileged_two_factor', true);
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner)
            ->getJson('/api/v1/dashboard')
            ->assertStatus(428)
            ->assertJsonPath('code', 'two_factor_setup_required');

        $this->getJson('/api/v1/me/security')
            ->assertOk()
            ->assertJsonPath('data.two_factor.required', true)
            ->assertJsonPath('data.two_factor.enabled', false);
    }

    public function test_temporary_password_must_be_changed_before_business_access(): void
    {
        $user = User::factory()->create([
            'password' => 'Temporary@123',
            'must_change_password' => true,
            'role' => 'staff',
        ]);

        $this->actingAs($user)
            ->getJson('/api/v1/dashboard')
            ->assertStatus(428)
            ->assertJsonPath('code', 'password_change_required');

        $this->putJson('/api/v1/me/security/password', [
            'current_password' => 'Temporary@123',
            'password' => 'Permanent@12345',
            'password_confirmation' => 'Permanent@12345',
        ])->assertOk()
            ->assertJsonPath('data.must_change_password', false);

        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertNotNull($user->fresh()->password_changed_at);
    }

    public function test_user_can_enable_two_factor_and_complete_login_with_one_time_recovery_code(): void
    {
        config()->set('security.require_privileged_two_factor', true);
        $owner = User::factory()->create([
            'email' => 'secure-owner@example.com',
            'password' => 'Admin@12345',
            'role' => 'owner',
        ]);

        $setup = $this->actingAs($owner)
            ->postJson('/api/v1/me/security/two-factor/setup', [
                'current_password' => 'Admin@12345',
            ])
            ->assertOk();
        $secret = $setup->json('data.secret');

        $confirmation = $this->postJson('/api/v1/me/security/two-factor/confirm', [
            'code' => $this->totpCode($secret, time()),
        ])->assertOk()
            ->assertJsonCount(8, 'data.recovery_codes');
        $recoveryCode = $confirmation->json('data.recovery_codes.0');

        $owner->refresh();
        $this->assertNotNull($owner->two_factor_confirmed_at);
        $this->assertNotSame(
            $secret,
            DB::table('users')->where('id', $owner->id)->value('two_factor_secret'),
        );

        $this->postJson('/api/v1/auth/logout')->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'secure-owner@example.com',
            'password' => 'Admin@12345',
            'remember' => false,
        ])->assertStatus(202)
            ->assertJsonPath('data.requires_two_factor', true);

        $this->postJson('/api/v1/auth/two-factor-challenge', [
            'code' => $recoveryCode,
        ])->assertOk()
            ->assertJsonPath('data.email', 'secure-owner@example.com')
            ->assertJsonPath('data.two_factor_enabled', true);

        $this->assertCount(7, $owner->fresh()->two_factor_recovery_codes);
    }

    public function test_required_privileged_two_factor_cannot_be_disabled(): void
    {
        config()->set('security.require_privileged_two_factor', true);
        $owner = User::factory()->create([
            'password' => 'Admin@12345',
            'role' => 'owner',
        ]);

        $setup = $this->actingAs($owner)
            ->postJson('/api/v1/me/security/two-factor/setup', [
                'current_password' => 'Admin@12345',
            ])
            ->assertOk();
        $secret = $setup->json('data.secret');

        $confirmation = $this->postJson('/api/v1/me/security/two-factor/confirm', [
            'code' => $this->totpCode($secret, time()),
        ])->assertOk();

        $this->deleteJson('/api/v1/me/security/two-factor', [
            'current_password' => 'Admin@12345',
            'code' => $confirmation->json('data.recovery_codes.0'),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('two_factor');

        $this->assertNotNull($owner->fresh()->two_factor_confirmed_at);
    }

    public function test_other_browser_sessions_can_be_revoked_without_exposing_raw_ids(): void
    {
        config()->set('session.driver', 'database');
        $user = User::factory()->create();
        DB::table('sessions')->insert([
            [
                'id' => 'session-one',
                'user_id' => $user->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Chrome/120',
                'payload' => 'payload',
                'last_activity' => now()->getTimestamp(),
            ],
            [
                'id' => 'session-two',
                'user_id' => $user->id,
                'ip_address' => '127.0.0.2',
                'user_agent' => 'Safari/17',
                'payload' => 'payload',
                'last_activity' => now()->subMinute()->getTimestamp(),
            ],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/me/security')
            ->assertOk();

        $this->assertGreaterThanOrEqual(2, count($response->json('data.sessions')));
        $this->assertNotContains('session-one', $response->json('data.sessions.*.id'));
        $this->assertNotContains('session-two', $response->json('data.sessions.*.id'));

        $revoked = $this->deleteJson('/api/v1/me/security/sessions/others')
            ->assertOk()
            ->json('data.revoked_sessions');

        $this->assertGreaterThanOrEqual(2, $revoked);
        $this->assertDatabaseMissing('sessions', ['id' => 'session-one']);
        $this->assertDatabaseMissing('sessions', ['id' => 'session-two']);
    }

    public function test_totp_implementation_accepts_the_rfc_counter_vector(): void
    {
        $step = app(TotpAuthenticator::class)->verify(
            'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
            '287082',
            59,
        );

        $this->assertSame(1, $step);
    }

    private function totpCode(string $secret, int $timestamp): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';

        foreach (str_split($secret) as $character) {
            $bits .= str_pad(
                decbin(strpos($alphabet, $character)),
                5,
                '0',
                STR_PAD_LEFT,
            );
        }

        $key = '';

        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $key .= chr(bindec($byte));
            }
        }

        $counter = intdiv($timestamp, 30);
        $binaryCounter = pack(
            'N2',
            intdiv($counter, 4_294_967_296),
            $counter % 4_294_967_296,
        );
        $hash = hash_hmac('sha1', $binaryCounter, $key, true);
        $offset = ord($hash[19]) & 0x0F;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF;

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }
}
