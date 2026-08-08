<?php

use App\Enums\UserRole;
use App\Models\InstallationSetting;
use App\Models\User;
use App\Services\InstallationState;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/** The settings payload the wizard posts, matching the administration form. */
function installationPayload(array $overrides = []): array
{
    return [
        'guestSharing' => true,
        'registration' => 'invite',
        'guestExpirations' => ['1h', '1d', '7d'],
        'memberExpirations' => ['1h', '1d', '7d', '30d', 'never'],
        'guestDefaultExpiration' => '1h',
        'memberDefaultExpiration' => '30d',
        'guestPasswordProtection' => true,
        'defaultQuotaMb' => 2048,
        'maxUploadMb' => 256,
        'fileTypeMode' => 'block',
        'fileTypeList' => ['exe'],
        'transferWindowHours' => 6,
        'payloadCleanupGraceHours' => 12,
        'malwareScanningEnabled' => false,
        ...$overrides,
    ];
}

it('sends every visitor to the wizard until the installation is finished', function (string $uri): void {
    $this->get($uri)->assertRedirect('/install/account');
})->with(['/', '/signin', '/register', '/library', '/transfer', '/admin/users']);

it('answers API requests with a service-unavailable status while pending', function (): void {
    $this->postJson('/api/v1/shares')
        ->assertStatus(503)
        ->assertJsonPath('message', 'This Dōzobin installation has not been set up yet.');
});

it('reports the database connection and the environment on the first step', function (): void {
    Storage::fake('local');
    // A migrated test database means the wizard has already moved past its
    // first step, so ask for the page it would otherwise redirect away from.
    DB::table('migrations')->where('migration', 'like', '%create_users_table')->delete();

    $this->get('/install/database')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('install/database')
            ->where('database.connected', true)
            ->where('database.migrated', false)
            ->has('requirements')
            ->where('requirements.0.label', 'PHP 8.4.1 or newer')
            ->where('requirements.4.label', 'File Store')
            ->where('requirements.4.satisfied', true)
            ->where('installation.complete', false)
            ->where('installation.step', 'database'));
});

it('reports database and File Store readiness separately', function (): void {
    Storage::fake('local');

    $this->getJson('/ready')
        ->assertOk()
        ->assertJson([
            'ready' => true,
            'database' => 'ready',
            'fileStore' => 'ready',
        ]);
});

it('keeps a visitor on the step that is actually outstanding', function (): void {
    $this->get('/install/settings')->assertRedirect('/install/account');
    $this->get('/install')->assertRedirect('/install/database');
    $this->get('/install/database')->assertRedirect('/install/account');
});

it('creates the first administrator and signs them in', function (): void {
    $this->post('/install/account', [
        'name' => 'Ruben Ishikawa',
        'email' => 'Admin@Dozobin.test',
        'password' => 'a-long-enough-password',
        'password_confirmation' => 'a-long-enough-password',
    ])->assertRedirect('/install/settings');

    $admin = User::query()->sole();

    expect($admin->email)->toBe('admin@dozobin.test')
        ->and($admin->role)->toBe(UserRole::Admin);

    $this->assertAuthenticatedAs($admin);
});

it('refuses a second administrator through the wizard', function (): void {
    User::factory()->admin()->create();

    $this->post('/install/account', [
        'name' => 'Someone Else',
        'email' => 'else@dozobin.test',
        'password' => 'a-long-enough-password',
        'password_confirmation' => 'a-long-enough-password',
    ])->assertRedirect('/install/settings');

    expect(User::query()->count())->toBe(1);
});

it('stores the settings, marks the installation done and reopens the application', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/install/settings', installationPayload())
        ->assertRedirect('/');

    $settings = InstallationSetting::query()->sole();

    expect($settings->installed_at)->not->toBeNull()
        ->and($settings->registration->value)->toBe('invite')
        ->and($settings->max_upload_mb)->toBe(256)
        ->and($settings->transfer_window_hours)->toBe(6);

    $this->get('/')->assertOk();
});

it('rejects settings that contradict each other', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/install/settings', installationPayload([
            'memberDefaultExpiration' => 'never',
            'memberExpirations' => ['1h', '1d'],
        ]))
        ->assertSessionHasErrors('memberDefaultExpiration');

    expect(InstallationSetting::query()->whereNotNull('installed_at')->exists())->toBeFalse();
});

it('will not finish the installation for a Member', function (): void {
    User::factory()->admin()->create();

    $this->actingAs(User::factory()->create())
        ->post('/install/settings', installationPayload())
        ->assertForbidden();
});

it('closes the wizard once the installation is finished', function (string $uri): void {
    InstallationSetting::factory()->create();

    $this->get($uri)->assertRedirect('/');
})->with(['/install', '/install/database', '/install/account', '/install/settings']);

it('treats a settings row without an installed_at as unfinished', function (): void {
    InstallationSetting::factory()->pending()->create();

    $this->get('/')->assertRedirect('/install/account');
});

it('knows an empty schema cannot back sessions or the cache', function (): void {
    $state = app(InstallationState::class);

    expect($state->databaseStoresReady())->toBeTrue();

    Schema::drop('sessions');
    $state->refresh();

    expect($state->databaseStoresReady())->toBeFalse();
});

it('skips the wizard entirely when the deployment opts out', function (): void {
    config(['dozobin.installation.bypass' => true]);

    $this->withoutVite()->get('/')->assertOk();
});
