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
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->constrained()->cascadeOnDelete();
            $table->index(['group_id', 'iso_week', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropIndex(['group_id', 'iso_week', 'weekday']);
            $table->dropColumn('group_id');
        });
    }
};