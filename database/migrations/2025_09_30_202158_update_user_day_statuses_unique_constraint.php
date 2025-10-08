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
        $driver = Schema::getConnection()->getDriverName();
        $oldIndexName = 'user_day_statuses_user_id_iso_week_weekday_unique';

        // Drop old unique index if it exists (SQLite-safe)
        if ($driver === 'sqlite') {
            $exists = \Illuminate\Support\Facades\DB::table('sqlite_master')
                ->where('type', 'index')
                ->where('name', $oldIndexName)
                ->exists();

            if ($exists) {
                Schema::table('user_day_statuses', function (Blueprint $table) use ($oldIndexName) {
                    $table->dropUnique($oldIndexName);
                });
            }
        } else {
            Schema::table('user_day_statuses', function (Blueprint $table) use ($oldIndexName) {
                // Drop the old unique constraint (uses Laravel's default index naming)
                $table->dropUnique($oldIndexName);
            });
        }

        // Add the new unique constraint that includes group_id
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->unique(['user_id', 'group_id', 'iso_week', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        $newIndexName = 'user_day_statuses_user_id_group_id_iso_week_weekday_unique';

        // Drop new unique index if it exists (SQLite-safe)
        if ($driver === 'sqlite') {
            $exists = \Illuminate\Support\Facades\DB::table('sqlite_master')
                ->where('type', 'index')
                ->where('name', $newIndexName)
                ->exists();

            if ($exists) {
                Schema::table('user_day_statuses', function (Blueprint $table) use ($newIndexName) {
                    $table->dropUnique($newIndexName);
                });
            }
        } else {
            Schema::table('user_day_statuses', function (Blueprint $table) use ($newIndexName) {
                $table->dropUnique($newIndexName);
            });
        }

        // Restore the old unique constraint
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });
    }
};
