<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('stores and removes a profile avatar', function (): void {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/profile', [
        '_method' => 'PATCH',
        'avatar' => UploadedFile::fake()->image('avatar.jpg'),
    ])->assertOk();

    $path = $user->fresh()->avatar_path;
    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists((string) $path);

    $this->actingAs($user)->patchJson('/profile', ['remove_avatar' => true])
        ->assertOk()
        ->assertJsonPath('data.avatarSrc', '');

    expect($user->fresh()->avatar_path)->toBeNull();
    Storage::disk('public')->assertMissing((string) $path);
});
