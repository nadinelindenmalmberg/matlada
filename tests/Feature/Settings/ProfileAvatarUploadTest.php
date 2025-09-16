<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('user can upload an avatar', function (): void {
    Storage::fake('public');

    $user = User::factory()->create();

    // Avoid GD dependency in CI: generate a fake file instead of image()
    $file = UploadedFile::fake()->create('avatar.jpg', 10, 'image/jpeg');

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'avatar' => $file,
        ]);

    $response->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->avatar)->not->toBeNull();
    Storage::disk('public')->assertExists($user->avatar);
});
