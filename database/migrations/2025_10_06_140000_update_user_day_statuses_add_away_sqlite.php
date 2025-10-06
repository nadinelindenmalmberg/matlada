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

        if ($driver !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        // Ensure temp artifacts do not exist from a previous failed run
        DB::statement('DROP INDEX IF EXISTS user_day_statuses_new_user_id_iso_week_weekday_unique');
        Schema::dropIfExists('user_day_statuses_new');

        // Recreate table to extend enum with 'Away' and preserve existing columns
        Schema::create('user_day_statuses_new', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('iso_week', 10);
            $table->unsignedTinyInteger('weekday');
            $table->enum('status', ['Lunchbox', 'Buying', 'Home', 'Away'])->nullable();
            $table->time('arrival_time')->nullable();
            $table->string('location', 120)->nullable();
            $table->string('start_location', 120)->nullable();
            $table->string('eat_location', 120)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });

        // Copy data across (no mapping needed; just preserve existing values)
        DB::statement(
            "INSERT INTO user_day_statuses_new (id, user_id, iso_week, weekday, status, arrival_time, location, start_location, eat_location, note, created_at, updated_at)
             SELECT id, user_id, iso_week, weekday, status, arrival_time, location, start_location, eat_location, note, created_at, updated_at
             FROM user_day_statuses"
        );

        Schema::drop('user_day_statuses');
        Schema::rename('user_day_statuses_new', 'user_day_statuses');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('DROP INDEX IF EXISTS user_day_statuses_old_user_id_iso_week_weekday_unique');
        Schema::dropIfExists('user_day_statuses_old');

        // Recreate table back without 'Away'
        Schema::create('user_day_statuses_old', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('iso_week', 10);
            $table->unsignedTinyInteger('weekday');
            $table->enum('status', ['Lunchbox', 'Buying', 'Home'])->nullable();
            $table->time('arrival_time')->nullable();
            $table->string('location', 120)->nullable();
            $table->string('start_location', 120)->nullable();
            $table->string('eat_location', 120)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'iso_week', 'weekday']);
        });

        DB::statement(
            "INSERT INTO user_day_statuses_old (id, user_id, iso_week, weekday, status, arrival_time, location, start_location, eat_location, note, created_at, updated_at)
             SELECT id, user_id, iso_week, weekday, status, arrival_time, location, start_location, eat_location, note, created_at, updated_at
             FROM user_day_statuses"
        );

        Schema::drop('user_day_statuses');
        Schema::rename('user_day_statuses_old', 'user_day_statuses');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};


