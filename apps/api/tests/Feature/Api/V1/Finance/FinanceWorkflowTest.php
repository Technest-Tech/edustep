<?php

namespace Tests\Feature\Api\V1\Finance;

use App\Enums\CohortStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\InvoiceStatus;
use App\Enums\StudentStatus;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Level;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_payments_update_invoice_balance_and_status(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $invoice = $this->createInvoice();

        $this->actingAs($user)
            ->postJson("/api/v1/finance/invoices/{$invoice->id}/payments", [
                'amount' => 1000,
                'method' => 'instapay',
                'reference' => 'IP-123',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', InvoiceStatus::PartiallyPaid->value)
            ->assertJsonPath('data.paid_amount', '1000.00')
            ->assertJsonPath('data.balance', '1400.00');

        $this->actingAs($user)
            ->postJson("/api/v1/finance/invoices/{$invoice->id}/payments", [
                'amount' => 1400,
                'method' => 'cash',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', InvoiceStatus::Paid->value)
            ->assertJsonPath('data.balance', '0.00');

        $this->assertDatabaseCount('payments', 2);
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => InvoiceStatus::Paid->value,
        ]);
    }

    public function test_a_payment_cannot_exceed_the_remaining_balance(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $invoice = $this->createInvoice();

        $this->actingAs($user)
            ->postJson("/api/v1/finance/invoices/{$invoice->id}/payments", [
                'amount' => 2500,
                'method' => 'cash',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');
    }

    public function test_finance_summary_reports_billed_and_outstanding_amounts(): void
    {
        $user = User::factory()->create(['role' => 'owner']);
        $this->createInvoice();

        $this->actingAs($user)
            ->getJson('/api/v1/finance/summary')
            ->assertOk()
            ->assertJsonPath('data.billed', '2400.00')
            ->assertJsonPath('data.collected', '0.00')
            ->assertJsonPath('data.outstanding', '2400.00')
            ->assertJsonPath('data.collection_rate', 0);
    }

    public function test_finance_endpoints_require_an_authorized_role(): void
    {
        $staff = User::factory()->create(['role' => 'admissions']);

        $this->actingAs($staff)
            ->getJson('/api/v1/finance/summary')
            ->assertForbidden();
    }

    private function createInvoice(): Invoice
    {
        $program = Program::query()->create([
            'code' => 'GENERAL',
            'name_ar' => 'الإنجليزية العامة',
        ]);
        $level = Level::query()->create([
            'program_id' => $program->id,
            'code' => 'A1',
            'name_ar' => 'المستوى A1',
        ]);
        $cohort = Cohort::query()->create([
            'program_id' => $program->id,
            'level_id' => $level->id,
            'code' => 'A-01',
            'name' => 'Adults A1',
            'status' => CohortStatus::Active,
            'capacity' => 12,
            'fee' => 2400,
        ]);
        $student = Student::query()->create([
            'student_code' => 'ES-2026-001',
            'full_name' => 'يوسف شريف',
            'phone' => '01044445555',
            'status' => StudentStatus::Active,
            'joined_on' => today(),
        ]);
        $enrollment = Enrollment::query()->create([
            'student_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => EnrollmentStatus::Active,
            'enrolled_on' => today(),
            'fee_amount' => 2400,
            'discount_amount' => 0,
            'net_amount' => 2400,
        ]);

        return Invoice::query()->create([
            'student_id' => $student->id,
            'enrollment_id' => $enrollment->id,
            'invoice_number' => 'INV-2026-0001',
            'status' => InvoiceStatus::Issued,
            'issued_on' => today(),
            'due_on' => today()->addWeek(),
            'subtotal' => 2400,
            'discount_amount' => 0,
            'total_amount' => 2400,
        ]);
    }
}
