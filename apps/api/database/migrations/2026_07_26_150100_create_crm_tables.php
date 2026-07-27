<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('interested_program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->string('full_name');
            $table->string('phone', 30)->index();
            $table->string('whatsapp_phone', 30)->nullable();
            $table->string('email')->nullable()->index();
            $table->string('source', 30)->index();
            $table->string('status', 30)->index();
            $table->string('preferred_contact_channel', 20)->default('whatsapp');
            $table->string('preferred_schedule')->nullable();
            $table->unsignedTinyInteger('learner_age')->nullable();
            $table->string('current_level')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->string('lost_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['owner_id', 'status']);
        });

        Schema::create('lead_activities', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30);
            $table->string('channel', 20)->nullable();
            $table->string('direction', 20)->nullable();
            $table->string('title');
            $table->text('details')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();
        });

        Schema::create('follow_ups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject');
            $table->text('notes')->nullable();
            $table->string('priority', 20)->default('medium')->index();
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('due_at')->index();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['assigned_to', 'status', 'due_at']);
        });

        Schema::create('placement_assessments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignUlid('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('recommended_level_id')->nullable()->constrained('levels')->nullOnDelete();
            $table->string('status', 20)->index();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placement_assessments');
        Schema::dropIfExists('follow_ups');
        Schema::dropIfExists('lead_activities');
        Schema::dropIfExists('leads');
    }
};
