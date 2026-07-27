<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_rate_rules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('rate_type', 30);
            $table->decimal('amount', 10, 2);
            $table->date('effective_from')->index();
            $table->date('effective_to')->nullable()->index();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['teacher_id', 'is_active', 'effective_from']);
        });

        Schema::create('teacher_earnings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_session_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignUlid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->foreignUlid('teacher_rate_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 30)->index();
            $table->unsignedInteger('duration_minutes');
            $table->string('rate_type', 30);
            $table->decimal('rate_amount', 10, 2);
            $table->decimal('amount', 10, 2);
            $table->json('calculation_snapshot');
            $table->date('earned_on')->index();
            $table->timestamp('approved_at')->nullable();
            $table->foreignUlid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['teacher_id', 'earned_on', 'status']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('expense_number', 40)->unique();
            $table->string('category', 80)->index();
            $table->string('vendor_name')->nullable();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->string('status', 30)->index();
            $table->date('incurred_on')->index();
            $table->date('due_on')->nullable()->index();
            $table->string('payment_method', 30)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('teacher_earnings');
        Schema::dropIfExists('teacher_rate_rules');
    }
};
