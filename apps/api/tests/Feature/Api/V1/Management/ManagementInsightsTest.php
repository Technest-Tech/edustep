<?php

namespace Tests\Feature\Api\V1\Management;

use App\Enums\FollowUpPriority;
use App\Enums\FollowUpStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementInsightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_notification_center_returns_actionable_items_for_the_current_user(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $lead = Lead::query()->create([
            'owner_id' => $owner->id,
            'full_name' => 'والدة ليان',
            'phone' => '01000000000',
            'source' => LeadSource::WhatsApp,
            'status' => LeadStatus::Contacted,
        ]);
        FollowUp::query()->create([
            'lead_id' => $lead->id,
            'assigned_to' => $owner->id,
            'subject' => 'تأكيد موعد اختبار المستوى',
            'priority' => FollowUpPriority::High,
            'status' => FollowUpStatus::Pending,
            'due_at' => now()->subHour(),
        ]);

        $this->actingAs($owner)
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1)
            ->assertJsonPath('data.items.0.type', 'follow_up')
            ->assertJsonPath('data.items.0.severity', 'urgent')
            ->assertJsonPath('data.items.0.href', "/leads/{$lead->id}");
    }

    public function test_management_can_open_operations_report_but_teacher_cannot(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($owner)
            ->getJson('/api/v1/reports/operations')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'summary' => [
                        'active_students',
                        'active_cohorts',
                        'sessions_completion_rate',
                        'attendance_rate',
                        'conversion_rate',
                        'collection_rate',
                    ],
                    'finance',
                    'attendance',
                    'lead_sources',
                    'cohorts',
                    'teachers',
                    'generated_at',
                ],
            ]);

        $this->actingAs($teacher)
            ->getJson('/api/v1/reports/operations')
            ->assertForbidden();
    }
}
