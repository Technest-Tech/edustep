<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_offers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('cohort_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('offer_number', 40)->unique();
            $table->string('status', 30)->index();
            $table->decimal('price_amount', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);
            $table->date('valid_until')->index();
            $table->text('notes')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status', 'valid_until']);
        });

        Schema::create('trial_bookings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('cohort_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('class_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->index();
            $table->timestamp('scheduled_at')->index();
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->string('meeting_url')->nullable();
            $table->string('room_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('attended_at')->nullable();
            $table->timestamps();

            $table->index(['cohort_id', 'scheduled_at', 'status']);
        });

        Schema::create('seat_reservations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('cohort_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('enrollment_offer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('reserved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->index();
            $table->timestamp('reserved_until')->index();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->text('release_reason')->nullable();
            $table->timestamps();

            $table->index(['cohort_id', 'status', 'reserved_until']);
        });

        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('cohort_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->index();
            $table->unsignedInteger('priority')->default(100)->index();
            $table->timestamp('joined_at')->index();
            $table->timestamp('offered_until')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['lead_id', 'cohort_id']);
            $table->index(['cohort_id', 'status', 'priority', 'joined_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
        Schema::dropIfExists('seat_reservations');
        Schema::dropIfExists('trial_bookings');
        Schema::dropIfExists('enrollment_offers');
    }
};
