<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('accepts Away status', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $week = Carbon::now()->isoFormat('GGGG-[W]WW');

    $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 1,
        'status' => 'Away',
        'arrival_time' => null,
        'location' => null,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 1,
        'status' => 'Away',
    ]);
});


