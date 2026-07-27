<?php

namespace Tests\Feature\Api\V1\Management;

use App\Enums\LeadSource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_owner_can_open_management_center(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $admissions = User::factory()->create(['role' => 'admissions']);

        $this->actingAs($owner)
            ->getJson('/api/v1/management')
            ->assertOk()
            ->assertJsonPath('data.settings.academy_name', 'EduStep English Academy')
            ->assertJsonPath('data.summary.active_users', 2)
            ->assertJsonStructure([
                'data' => ['summary', 'settings', 'roles', 'team', 'audit_logs'],
            ]);

        $this->actingAs($admissions)
            ->getJson('/api/v1/management')
            ->assertForbidden();
    }

    public function test_owner_can_update_settings_with_a_safe_audit_diff(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $payload = [
            'academy_name' => 'EduStep Cairo',
            'academy_name_en' => 'EduStep Cairo',
            'phone' => '01010000000',
            'whatsapp_phone' => '01010000000',
            'email' => 'hello@edustep.test',
            'website' => 'https://edustep.test',
            'address' => 'المعادي، القاهرة',
            'timezone' => 'Africa/Cairo',
            'locale' => 'ar',
            'currency' => 'EGP',
            'invoice_prefix' => 'EDUINV',
            'student_code_prefix' => 'EDU',
            'offer_validity_days' => 10,
            'seat_hold_hours' => 72,
            'working_days' => ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday'],
            'business_hours' => ['start' => '09:00', 'end' => '20:00'],
        ];

        $this->actingAs($owner)
            ->patchJson('/api/v1/management/settings', $payload)
            ->assertOk()
            ->assertJsonPath('data.academy_name', 'EduStep Cairo')
            ->assertJsonPath('data.seat_hold_hours', 72);

        $audit = AuditLog::query()->where('action', 'settings.updated')->firstOrFail();
        $this->assertSame('EduStep English Academy', $audit->old_values['academy_name']);
        $this->assertSame('EduStep Cairo', $audit->new_values['academy_name']);
        $this->assertContains('seat_hold_hours', $audit->changed_fields);
    }

    public function test_owner_can_create_and_suspend_staff_but_cannot_disable_self(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $response = $this->actingAs($owner)
            ->postJson('/api/v1/management/team', [
                'name' => 'مسؤول تشغيل',
                'email' => 'operations@example.test',
                'phone' => '01012345678',
                'job_title' => 'Operations Coordinator',
                'role' => 'staff',
                'status' => 'active',
                'password' => 'SecurePass123',
                'password_confirmation' => 'SecurePass123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.role', 'staff')
            ->assertJsonPath('data.status', 'active');

        $memberId = $response->json('data.id');
        $this->actingAs($owner)
            ->patchJson("/api/v1/management/team/{$memberId}", [
                'status' => 'suspended',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->actingAs($owner)
            ->patchJson("/api/v1/management/team/{$owner->id}", [
                'status' => 'suspended',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user');

        $audit = AuditLog::query()->where('action', 'team.user_created')->firstOrFail();
        $this->assertArrayNotHasKey('password', $audit->new_values);
        $this->assertContains('password', $audit->changed_fields);
    }

    public function test_authenticated_mutations_are_automatically_audited_without_request_values(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner)
            ->postJson('/api/v1/leads', [
                'full_name' => 'عميل تدقيق',
                'phone' => '01099990000',
                'source' => LeadSource::WhatsApp->value,
            ])
            ->assertCreated();

        $audit = AuditLog::query()
            ->where('route_name', 'api.v1.leads.store')
            ->firstOrFail();
        $this->assertSame('crm', $audit->category);
        $this->assertSame(['full_name', 'phone', 'source'], $audit->changed_fields);
        $this->assertNull($audit->new_values);
        $this->assertNotNull($audit->request_id);
    }
}
