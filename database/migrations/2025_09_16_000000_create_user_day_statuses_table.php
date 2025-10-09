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
        Schema::create('user_day_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('iso_week', 10);
            $table->unsignedTinyInteger('weekday');
            $table->enum('status', ['Matlåda', 'Köpa', 'Hemma'])->nullable();
            $table->time('arrival_time')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'group_id', 'iso_week', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_day_statuses');
    }
};
