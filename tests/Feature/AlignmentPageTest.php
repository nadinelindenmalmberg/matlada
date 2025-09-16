<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders alignment page for authenticated user', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get('/alignment');

    $response->assertSuccessful();
});
