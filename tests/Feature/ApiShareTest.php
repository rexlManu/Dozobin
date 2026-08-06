<?php

use App\Models\ApiToken;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    InstallationSetting::factory()->create();
    Storage::fake('local');
});

it('uploads and deletes shares using a bearer token', function (): void {
    $plain = 'dozo_'.str_repeat('a', 40);
    $user = User::factory()->create();
    $token = ApiToken::factory()->for($user)->create([
        'token_hash' => hash('sha256', $plain),
        'revoked_at' => null,
    ]);

    $created = $this->withToken($plain)->postJson('/api/v1/shares', [
        'file' => UploadedFile::fake()->create('notes.txt', 4, 'text/plain'),
        'expiration' => '7d',
    ])->assertCreated()->assertJsonStructure(['id', 'url', 'delete_url']);

    $share = Share::query()->sole();
    expect($share->user_id)->toBe($user->id)
        ->and($token->fresh()->last_used_at)->not->toBeNull();

    $this->withToken($plain)->deleteJson($created->json('delete_url'))->assertNoContent();
    $this->assertSoftDeleted($share);
});

it('rejects revoked API tokens', function (): void {
    $plain = 'dozo_'.str_repeat('b', 40);
    ApiToken::factory()->create([
        'token_hash' => hash('sha256', $plain),
        'revoked_at' => now(),
    ]);

    $this->withToken($plain)->postJson('/api/v1/shares', [
        'file' => UploadedFile::fake()->create('notes.txt', 4),
        'expiration' => '7d',
    ])->assertUnauthorized();
});
