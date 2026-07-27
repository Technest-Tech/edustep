<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_packages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('level_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->unsignedSmallInteger('sessions_count');
            $table->unsignedSmallInteger('duration_weeks');
            $table->decimal('price', 10, 2);
            $table->unsignedTinyInteger('default_installments')->default(1);
            $table->boolean('is_active')->default(true)->index();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('student_subscriptions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('study_package_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('parent_subscription_id')->nullable()->constrained('student_subscriptions')->nullOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->index();
            $table->date('starts_on')->index();
            $table->date('ends_on')->index();
            $table->date('renewal_due_on')->index();
            $table->unsignedSmallInteger('included_sessions');
            $table->decimal('price_amount', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);
            $table->timestamp('frozen_at')->nullable();
            $table->date('frozen_until')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status', 'ends_on']);
        });

        Schema::create('subscription_installments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('student_subscription_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('invoice_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('installment_number');
            $table->decimal('amount', 10, 2);
            $table->date('due_on')->index();
            $table->string('status', 30)->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['student_subscription_id', 'installment_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_installments');
        Schema::dropIfExists('student_subscriptions');
        Schema::dropIfExists('study_packages');
    }
};
