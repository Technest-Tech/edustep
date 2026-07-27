<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('job_title', 120)->nullable()->after('phone');
        });

        Schema::create('academy_settings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('academy_name');
            $table->string('academy_name_en')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('whatsapp_phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->text('address')->nullable();
            $table->string('timezone', 50)->default('Africa/Cairo');
            $table->string('locale', 5)->default('ar');
            $table->string('currency', 3)->default('EGP');
            $table->string('invoice_prefix', 20)->default('INV');
            $table->string('student_code_prefix', 20)->default('ES');
            $table->unsignedSmallInteger('offer_validity_days')->default(7);
            $table->unsignedSmallInteger('seat_hold_hours')->default(48);
            $table->json('working_days')->nullable();
            $table->json('business_hours')->nullable();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 150)->index();
            $table->string('category', 50)->index();
            $table->nullableUlidMorphs('auditable');
            $table->text('description');
            $table->string('method', 10)->nullable();
            $table->string('route_name', 150)->nullable()->index();
            $table->string('request_id', 50)->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('changed_fields')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('academy_settings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'job_title']);
        });
    }
};
