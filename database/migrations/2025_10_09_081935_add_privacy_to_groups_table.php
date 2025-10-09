<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->enum('privacy', ['private', 'public'])->default('private');
            $table->enum('category', ['location', 'interest', 'program', 'course', 'other'])->nullable();
            $table->string('tags')->nullable(); // Comma-separated tags
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['privacy', 'category', 'tags']);
        });
    }
};
