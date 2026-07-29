<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_stages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code', 40)->unique();
            $table->string('audience');
            $table->string('source_level', 40);
            $table->string('cefr_reference', 60)->nullable();
            $table->string('source_version', 40)->index();
            $table->timestamps();
        });

        Schema::create('curriculum_units', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('curriculum_stage_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('unit_number');
            $table->string('theme');
            $table->text('can_do_outcome');
            $table->text('target_language')->nullable();
            $table->text('lexis')->nullable();
            $table->text('pronunciation_focus')->nullable();
            $table->text('performance_task')->nullable();
            $table->text('unit_check')->nullable();
            $table->timestamps();

            $table->unique(['curriculum_stage_id', 'unit_number']);
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->unsignedTinyInteger('age_min')->nullable()->after('description');
            $table->unsignedTinyInteger('age_max')->nullable()->after('age_min');
            $table->string('catalog_version', 40)->nullable()->index()->after('age_max');
            $table->unsignedTinyInteger('sessions_per_week')->nullable()->after('catalog_version');
            $table->unsignedSmallInteger('default_duration_weeks')->nullable()->after('sessions_per_week');
            $table->unsignedSmallInteger('default_sessions_count')->nullable()->after('default_duration_weeks');
            $table->unsignedSmallInteger('session_duration_minutes')->nullable()->after('default_sessions_count');
            $table->unsignedSmallInteger('home_practice_minutes_min')->nullable()->after('session_duration_minutes');
            $table->unsignedSmallInteger('home_practice_minutes_max')->nullable()->after('home_practice_minutes_min');
            $table->unsignedSmallInteger('minimum_group_size')->nullable()->after('home_practice_minutes_max');
            $table->unsignedSmallInteger('maximum_group_size')->nullable()->after('minimum_group_size');
            $table->decimal('launch_price', 10, 2)->nullable()->after('maximum_group_size');
            $table->decimal('standard_price', 10, 2)->nullable()->after('launch_price');
            $table->decimal('one_to_one_price', 10, 2)->nullable()->after('standard_price');
            $table->decimal('full_payment_discount_percent', 5, 2)->nullable()->after('one_to_one_price');
            $table->decimal('promotion_score_percent', 5, 2)->nullable()->after('full_payment_discount_percent');
            $table->decimal('promotion_attendance_percent', 5, 2)->nullable()->after('promotion_score_percent');
        });

        Schema::table('levels', function (Blueprint $table) {
            $table->foreignUlid('curriculum_stage_id')
                ->nullable()
                ->after('program_id')
                ->constrained()
                ->nullOnDelete();
            $table->string('cefr_reference', 60)->nullable()->after('name_en');
            $table->text('entry_rule')->nullable()->after('cefr_reference');
            $table->text('outcome')->nullable()->after('entry_rule');
            $table->unsignedSmallInteger('sessions_count')->nullable()->after('outcome');
            $table->unsignedSmallInteger('duration_weeks')->nullable()->after('sessions_count');
            $table->unsignedTinyInteger('sessions_per_week')->nullable()->after('duration_weeks');
            $table->unsignedSmallInteger('session_duration_minutes')->nullable()->after('sessions_per_week');
            $table->decimal('guided_hours', 5, 1)->nullable()->after('session_duration_minutes');
            $table->decimal('launch_price', 10, 2)->nullable()->after('guided_hours');
            $table->decimal('standard_price', 10, 2)->nullable()->after('launch_price');
            $table->decimal('one_to_one_price', 10, 2)->nullable()->after('standard_price');
            $table->unsignedSmallInteger('minimum_group_size')->nullable()->after('one_to_one_price');
            $table->unsignedSmallInteger('maximum_group_size')->nullable()->after('minimum_group_size');
            $table->unsignedTinyInteger('default_installments')->nullable()->after('maximum_group_size');
            $table->boolean('is_optional')->default(false)->after('default_installments');
            $table->string('catalog_version', 40)->nullable()->index()->after('is_optional');
        });

        Schema::table('study_packages', function (Blueprint $table) {
            $table->decimal('standard_price', 10, 2)->nullable()->after('price');
            $table->decimal('full_payment_discount_percent', 5, 2)->default(0)->after('standard_price');
            $table->unsignedSmallInteger('second_installment_session')->nullable()->after('default_installments');
            $table->unsignedTinyInteger('second_installment_due_days_before')->nullable()->after('second_installment_session');
            $table->string('source_version', 40)->nullable()->index()->after('second_installment_due_days_before');
        });

        Schema::table('cohorts', function (Blueprint $table) {
            $table->foreignUlid('study_package_id')
                ->nullable()
                ->after('level_id')
                ->constrained()
                ->nullOnDelete();
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->unsignedSmallInteger('session_number')->nullable()->after('teacher_id');
            $table->string('cycle_phase', 40)->nullable()->after('session_number');
        });
    }

    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropColumn(['session_number', 'cycle_phase']);
        });

        Schema::table('cohorts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('study_package_id');
        });

        Schema::table('study_packages', function (Blueprint $table) {
            $table->dropColumn([
                'standard_price',
                'full_payment_discount_percent',
                'second_installment_session',
                'second_installment_due_days_before',
                'source_version',
            ]);
        });

        Schema::table('levels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('curriculum_stage_id');
            $table->dropColumn([
                'cefr_reference',
                'entry_rule',
                'outcome',
                'sessions_count',
                'duration_weeks',
                'sessions_per_week',
                'session_duration_minutes',
                'guided_hours',
                'launch_price',
                'standard_price',
                'one_to_one_price',
                'minimum_group_size',
                'maximum_group_size',
                'default_installments',
                'is_optional',
                'catalog_version',
            ]);
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn([
                'age_min',
                'age_max',
                'catalog_version',
                'sessions_per_week',
                'default_duration_weeks',
                'default_sessions_count',
                'session_duration_minutes',
                'home_practice_minutes_min',
                'home_practice_minutes_max',
                'minimum_group_size',
                'maximum_group_size',
                'launch_price',
                'standard_price',
                'one_to_one_price',
                'full_payment_discount_percent',
                'promotion_score_percent',
                'promotion_attendance_percent',
            ]);
        });

        Schema::dropIfExists('curriculum_units');
        Schema::dropIfExists('curriculum_stages');
    }
};
