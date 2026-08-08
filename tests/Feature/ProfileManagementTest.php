<?php

use App\Models\InstallationSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(fn () => InstallationSetting::factory()->create());

it('stores and removes a profile avatar', function (): void {
    Storage::fake('local');
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/profile', [
        '_method' => 'PATCH',
        'avatar' => UploadedFile::fake()->image('avatar.jpg'),
    ])->assertOk();

    $path = $user->fresh()->avatar_path;
    expect($path)->not->toBeNull();
    Storage::disk('local')->assertExists((string) $path);

    $avatarUrl = $response->json('data.avatarSrc');
    $avatarPath = parse_url((string) $avatarUrl, PHP_URL_PATH).'?'.parse_url((string) $avatarUrl, PHP_URL_QUERY);
    $this->get($avatarPath)
        ->assertOk()
        ->assertHeader('cache-control', 'immutable, max-age=31536000, public');

    $this->actingAs($user)->patchJson('/profile', ['remove_avatar' => true])
        ->assertOk()
        ->assertJsonPath('data.avatarSrc', '');

    expect($user->fresh()->avatar_path)->toBeNull();
    Storage::disk('local')->assertMissing((string) $path);
});
