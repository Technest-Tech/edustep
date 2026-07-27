<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_progress_reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('level_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('period_label');
            $table->date('period_starts_on');
            $table->date('period_ends_on');
            $table->string('status', 30)->index();
            $table->decimal('overall_score', 5, 2)->nullable();
            $table->string('overall_rating', 30);
            $table->decimal('attendance_rate', 5, 2)->nullable();
            $table->text('summary');
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('next_steps')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();

            $table->index(['student_id', 'status', 'period_ends_on']);
        });

        Schema::create('academic_risks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 40)->index();
            $table->string('severity', 20)->index();
            $table->string('status', 30)->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_automatic')->default(false);
            $table->timestamp('detected_at')->index();
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status', 'severity']);
        });

        Schema::create('academic_interventions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('academic_risk_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 40);
            $table->string('status', 30)->index();
            $table->string('title');
            $table->text('plan');
            $table->date('due_on')->nullable()->index();
            $table->text('outcome')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status', 'due_on']);
        });

        Schema::create('family_service_requests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('guardian_id')->constrained('guardian_profiles')->cascadeOnDelete();
            $table->foreignUlid('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('request_number', 40)->unique();
            $table->string('category', 40)->index();
            $table->string('priority', 20)->default('normal')->index();
            $table->string('status', 30)->index();
            $table->string('subject');
            $table->text('description');
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['guardian_id', 'student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_service_requests');
        Schema::dropIfExists('academic_interventions');
        Schema::dropIfExists('academic_risks');
        Schema::dropIfExists('student_progress_reports');
    }
};
