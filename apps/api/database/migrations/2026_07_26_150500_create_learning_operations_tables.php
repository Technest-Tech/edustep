<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_sessions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('cohort_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('status', 30)->index();
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at');
            $table->string('meeting_url')->nullable();
            $table->string('room_name')->nullable();
            $table->text('lesson_focus')->nullable();
            $table->text('teacher_notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['cohort_id', 'starts_at']);
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('class_session_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->index();
            $table->timestamp('checked_in_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['class_session_id', 'student_id']);
        });

        Schema::create('progress_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30)->index();
            $table->string('title');
            $table->decimal('score', 5, 2)->nullable();
            $table->string('rating', 30)->index();
            $table->text('feedback')->nullable();
            $table->date('occurred_on')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_entries');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('class_sessions');
    }
};
