<?php

use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    InstallationSetting::factory()->create();
    Storage::fake('local');
});

it('creates guest pastes without exposing the stored password hash', function (): void {
    $response = $this->postJson('/shares/pastes', [
        'body' => 'A private note',
        'paste_type' => 'text',
        'expiration' => '1d',
        'password' => 'hinoki',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.kind', 'paste')
        ->assertJsonPath('data.body', '')
        ->assertJsonPath('data.password', 'protected')
        ->assertJsonMissing(['password' => Hash::make('hinoki')]);

    $share = Share::query()->sole();
    expect($share->user_id)->toBeNull()
        ->and(Hash::check('hinoki', (string) $share->password))->toBeTrue();
});

it('enforces installation guest sharing and file restrictions', function (): void {
    InstallationSetting::current()->update(['guest_sharing' => false]);

    $this->postJson('/shares/pastes', [
        'body' => 'blocked',
        'paste_type' => 'text',
        'expiration' => '1d',
    ])->assertForbidden();

    $user = User::factory()->create();
    $this->actingAs($user)->postJson('/shares/files', [
        'file' => UploadedFile::fake()->create('payload.exe', 10),
        'expiration' => '7d',
    ])->assertUnprocessable()->assertJsonValidationErrors('file');
});

it('stores uploads and only lets their owner delete them', function (): void {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $created = $this->actingAs($owner)->postJson('/shares/files', [
        'file' => UploadedFile::fake()->image('photo.jpg'),
        'expiration' => '7d',
    ])->assertCreated();

    $share = Share::query()->sole();
    Storage::disk('local')->assertExists((string) $share->storage_path);

    $this->actingAs($other)->deleteJson('/shares', ['ids' => [$created->json('data.id')]])
        ->assertForbidden();
    $this->assertDatabaseHas('shares', ['id' => $share->id, 'deleted_at' => null]);

    $this->actingAs($owner)->deleteJson('/shares', ['ids' => [$share->slug]])->assertNoContent();
    $this->assertSoftDeleted($share);
    Storage::disk('local')->assertMissing((string) $share->storage_path);
});
