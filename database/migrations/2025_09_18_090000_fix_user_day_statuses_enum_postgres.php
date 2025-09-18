<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'pgsql') {
            return;
        }

        // Ensure existing rows use English values before changing the constraint
        DB::table('user_day_statuses')->where('status', 'Matlåda')->update(['status' => 'Lunchbox']);
        DB::table('user_day_statuses')->where('status', 'Köpa')->update(['status' => 'Buying']);
        DB::table('user_day_statuses')->where('status', 'Hemma')->update(['status' => 'Home']);

        // Drop old CHECK constraint if it exists (created by Laravel's enum mapping)
        DB::statement('ALTER TABLE user_day_statuses DROP CONSTRAINT IF EXISTS user_day_statuses_status_check');

        // Recreate CHECK constraint with English values
        DB::statement("ALTER TABLE user_day_statuses ADD CONSTRAINT user_day_statuses_status_check CHECK (status IN ('Lunchbox','Buying','Home') OR status IS NULL)");
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'pgsql') {
            return;
        }

        // Revert the CHECK constraint back to Swedish values
        DB::statement('ALTER TABLE user_day_statuses DROP CONSTRAINT IF EXISTS user_day_statuses_status_check');
        DB::statement("ALTER TABLE user_day_statuses ADD CONSTRAINT user_day_statuses_status_check CHECK (status IN ('Matlåda','Köpa','Hemma') OR status IS NULL)");
    }
};
