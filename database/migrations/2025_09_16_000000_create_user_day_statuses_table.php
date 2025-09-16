<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
	/**
	 * Run the migrations.
	 */
	public function up(): void
	{
		Schema::create('user_day_statuses', function (Blueprint $table) {
			$table->id();
			$table->foreignId('user_id')->constrained()->cascadeOnDelete();
			// ISO week reference (YYYY-Www), e.g., 2025-W38
			$table->string('iso_week', 10);
			// Weekday 1-5 (Mon-Fri). We only store weekdays per requirement
			$table->unsignedTinyInteger('weekday');
			// Enum-like string: 'Matlåda' | 'Köpa' | null
			$table->enum('status', ['Matlåda', 'Köpa'])->nullable();
			// Arrival time in HH:MM format; nullable
			$table->time('arrival_time')->nullable();
			$table->timestamps();
			$table->unique(['user_id', 'iso_week', 'weekday']);
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


