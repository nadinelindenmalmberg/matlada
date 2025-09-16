<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            Schema::create('user_day_statuses_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('iso_week', 10);
                $table->unsignedTinyInteger('weekday');
                $table->enum('status', ['Lunchbox', 'Buying', 'Home'])->nullable();
                $table->time('arrival_time')->nullable();
                $table->string('location', 120)->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'iso_week', 'weekday']);
            });

            // Copy with value mapping
            DB::statement(
                "INSERT INTO user_day_statuses_new (id, user_id, iso_week, weekday, status, arrival_time, location, created_at, updated_at)
                 SELECT id, user_id, iso_week, weekday,
                 CASE status
                   WHEN 'Matlåda' THEN 'Lunchbox'
                   WHEN 'Köpa' THEN 'Buying'
                   WHEN 'Hemma' THEN 'Home'
                   ELSE status
                 END as status,
                 arrival_time, location, created_at, updated_at
                 FROM user_day_statuses"
            );

            Schema::drop('user_day_statuses');
            Schema::rename('user_day_statuses_new', 'user_day_statuses');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            // For MySQL/PostgreSQL: first translate existing data values to English
            DB::table('user_day_statuses')->where('status', 'Matlåda')->update(['status' => 'Lunchbox']);
            DB::table('user_day_statuses')->where('status', 'Köpa')->update(['status' => 'Buying']);
            DB::table('user_day_statuses')->where('status', 'Hemma')->update(['status' => 'Home']);

            // Then modify enum constraint if supported (MySQL). Use raw statement guarded by driver.
            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE user_day_statuses MODIFY COLUMN status ENUM('Lunchbox','Buying','Home') NULL");
            }
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            Schema::create('user_day_statuses_old', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('iso_week', 10);
                $table->unsignedTinyInteger('weekday');
                $table->enum('status', ['Matlåda', 'Köpa', 'Hemma'])->nullable();
                $table->time('arrival_time')->nullable();
                $table->string('location', 120)->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'iso_week', 'weekday']);
            });

            DB::statement(
                "INSERT INTO user_day_statuses_old (id, user_id, iso_week, weekday, status, arrival_time, location, created_at, updated_at)
                 SELECT id, user_id, iso_week, weekday,
                 CASE status
                   WHEN 'Lunchbox' THEN 'Matlåda'
                   WHEN 'Buying' THEN 'Köpa'
                   WHEN 'Home' THEN 'Hemma'
                   ELSE status
                 END as status,
                 arrival_time, location, created_at, updated_at
                 FROM user_day_statuses"
            );

            Schema::drop('user_day_statuses');
            Schema::rename('user_day_statuses_old', 'user_day_statuses');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE user_day_statuses MODIFY COLUMN status ENUM('Matlåda','Köpa','Hemma') NULL");
            }

            DB::table('user_day_statuses')->where('status', 'Lunchbox')->update(['status' => 'Matlåda']);
            DB::table('user_day_statuses')->where('status', 'Buying')->update(['status' => 'Köpa']);
            DB::table('user_day_statuses')->where('status', 'Home')->update(['status' => 'Hemma']);
        }
    }
};
