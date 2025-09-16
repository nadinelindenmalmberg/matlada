<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('sets locale in session and shares it via inertia', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('locale.set'), ['locale' => 'sv'])
        ->assertRedirect();

    $this->assertSame('sv', session('locale'));

    $response = $this->get('/week-status');
    $response->assertOk();

    $props = $response->viewData('page')['props'] ?? [];
    expect($props['locale'] ?? null)->toBe('sv');
});
