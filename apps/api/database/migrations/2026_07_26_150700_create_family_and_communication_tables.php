<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 30)->index();
            $table->string('preferred_channel', 30)->default('whatsapp');
            $table->string('relationship_label')->nullable();
            $table->timestamps();
        });

        Schema::create('guardian_student', function (Blueprint $table) {
            $table->foreignUlid('guardian_id')->constrained('guardian_profiles')->cascadeOnDelete();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->string('relationship', 50)->default('guardian');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->primary(['guardian_id', 'student_id']);
        });

        Schema::create('message_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('key', 80)->unique();
            $table->string('name');
            $table->string('channel', 30);
            $table->string('subject')->nullable();
            $table->text('body');
            $table->boolean('is_active')->default(true);
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('guardian_id')->nullable()->constrained('guardian_profiles')->nullOnDelete();
            $table->foreignUlid('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('message_template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('channel', 30)->index();
            $table->string('direction', 20)->default('outbound');
            $table->string('subject')->nullable();
            $table->text('body');
            $table->string('status', 30)->index();
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['guardian_id', 'student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('guardian_student');
        Schema::dropIfExists('guardian_profiles');
    }
};
