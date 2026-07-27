<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code', 30)->unique();
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('levels', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->unique(['program_id', 'code']);
        });

        Schema::create('cohorts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('level_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('status', 20)->index();
            $table->string('delivery_mode', 20)->default('online');
            $table->unsignedSmallInteger('capacity')->default(12);
            $table->decimal('fee', 10, 2)->default(0);
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->json('schedule')->nullable();
            $table->string('timezone', 50)->default('Africa/Cairo');
            $table->string('meeting_url')->nullable();
            $table->string('room_name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cohorts');
        Schema::dropIfExists('levels');
        Schema::dropIfExists('programs');
    }
};
