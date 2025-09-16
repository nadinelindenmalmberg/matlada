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

            Schema::create('user_day_statuses_tmp', function (Blueprint $table) {
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

            DB::statement('INSERT INTO user_day_statuses_tmp (id, user_id, iso_week, weekday, status, arrival_time, location, created_at, updated_at)
                            SELECT id, user_id, iso_week, weekday, status, arrival_time, location, created_at, updated_at FROM user_day_statuses');

            Schema::drop('user_day_statuses');
            Schema::rename('user_day_statuses_tmp', 'user_day_statuses');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            Schema::table('user_day_statuses', function (Blueprint $table) {
                $table->enum('status', ['Matlåda', 'Köpa', 'Hemma'])->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            Schema::create('user_day_statuses_tmp', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('iso_week', 10);
                $table->unsignedTinyInteger('weekday');
                $table->enum('status', ['Matlåda', 'Köpa'])->nullable();
                $table->time('arrival_time')->nullable();
                $table->string('location', 120)->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'iso_week', 'weekday']);
            });

            DB::statement("INSERT INTO user_day_statuses_tmp (id, user_id, iso_week, weekday, status, arrival_time, location, created_at, updated_at)
                            SELECT id, user_id, iso_week, weekday, CASE WHEN status = 'Hemma' THEN NULL ELSE status END, arrival_time, location, created_at, updated_at FROM user_day_statuses");

            Schema::drop('user_day_statuses');
            Schema::rename('user_day_statuses_tmp', 'user_day_statuses');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            Schema::table('user_day_statuses', function (Blueprint $table) {
                $table->enum('status', ['Matlåda', 'Köpa'])->nullable()->change();
            });
        }
    }
};
