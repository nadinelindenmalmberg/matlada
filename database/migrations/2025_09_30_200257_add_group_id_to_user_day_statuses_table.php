<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
        
        // Update the unique constraint to include group_id
        // Drop the old unique constraint using the correct index name
        DB::statement('DROP INDEX IF EXISTS user_day_statuses_user_id_iso_week_weekday_unique');
        
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->unique(['user_id', 'group_id', 'iso_week', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'group_id', 'iso_week', 'weekday']);
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });
        
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropIndex(['group_id', 'iso_week', 'weekday']);
            $table->dropColumn('group_id');
        });
    }
};
