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
            // Drop the old unique constraint (uses Laravel's default index naming)
            $table->dropUnique(['user_id', 'iso_week', 'weekday']);

            // Add the new unique constraint that includes group_id
            $table->unique(['user_id', 'group_id', 'iso_week', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_day_statuses', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique(['user_id', 'group_id', 'iso_week', 'weekday']);
            
            // Restore the old unique constraint
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });
    }
};