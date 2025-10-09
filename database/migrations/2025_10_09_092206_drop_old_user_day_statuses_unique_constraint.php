<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration drops the old unique constraint that doesn't include group_id,
     * leaving only the correct constraint that allows multiple statuses per user/weekday
     * as long as they have different group_id values.
     */
    public function up(): void
    {
        // Drop the old unique constraint that doesn't include group_id
        DB::statement('DROP INDEX IF EXISTS user_day_statuses_new_user_id_iso_week_weekday_unique');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the old unique constraint (this will fail if there are duplicate user/weekday combinations)
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });
    }
};