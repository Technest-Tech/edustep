<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academy_closures', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->date('starts_on')->index();
            $table->date('ends_on')->index();
            $table->boolean('affects_online')->default(true);
            $table->string('reason')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_closures');
    }
};
