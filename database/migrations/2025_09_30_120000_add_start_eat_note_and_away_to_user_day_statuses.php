<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->string('start_location', 120)->nullable()->after('location');
            $table->string('eat_location', 120)->nullable()->after('start_location');
            $table->text('note')->nullable()->after('eat_location');
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE user_day_statuses MODIFY COLUMN status ENUM('Lunchbox','Buying','Home','Away') NULL");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE user_day_statuses DROP CONSTRAINT IF EXISTS user_day_statuses_status_check');
            DB::statement("ALTER TABLE user_day_statuses ADD CONSTRAINT user_day_statuses_status_check CHECK (status IN ('Lunchbox','Buying','Home','Away') OR status IS NULL)");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE user_day_statuses MODIFY COLUMN status ENUM('Lunchbox','Buying','Home') NULL");
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE user_day_statuses DROP CONSTRAINT IF EXISTS user_day_statuses_status_check');
            DB::statement("ALTER TABLE user_day_statuses ADD CONSTRAINT user_day_statuses_status_check CHECK (status IN ('Lunchbox','Buying','Home') OR status IS NULL)");
        }

        Schema::table('user_day_statuses', function (Blueprint $table) {
            $table->dropColumn(['start_location', 'eat_location', 'note']);
        });
    }
};
