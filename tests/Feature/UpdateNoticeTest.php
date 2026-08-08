<?php

use App\Models\InstallationSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    InstallationSetting::factory()->create();
    config(['inertia.ssr.enabled' => false]);
});

it('does not contact GitHub for a development build', function (): void {
    Http::preventStrayRequests();
    config(['dozobin.release.version' => 'dev']);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/admin/settings/system')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings/system')
            ->where('update.currentVersion', 'dev')
            ->where('update.checksEnabled', false)
            ->where('update.updateAvailable', false));
});

it('shows administrators a newer stable GitHub release', function (): void {
    config([
        'dozobin.release.version' => '1.2.3',
        'dozobin.release.repository' => 'rexlManu/Dozobin',
        'dozobin.release.update_checks' => true,
    ]);
    Http::fake([
        'https://api.github.com/repos/rexlManu/Dozobin/releases/latest' => Http::response([
            'tag_name' => 'v1.3.0',
            'html_url' => 'https://github.com/rexlManu/Dozobin/releases/tag/v1.3.0',
        ]),
    ]);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('update.currentVersion', '1.2.3')
            ->where('update.latestVersion', '1.3.0')
            ->where('update.updateAvailable', true)
            ->where('update.dismissed', false));

    Http::assertSentCount(1);
});

it('dismisses one release for one administrator', function (): void {
    config([
        'dozobin.release.version' => '1.2.3',
        'dozobin.release.repository' => 'rexlManu/Dozobin',
        'dozobin.release.update_checks' => true,
    ]);
    Http::fake([
        'https://api.github.com/repos/rexlManu/Dozobin/releases/latest' => Http::response([
            'tag_name' => 'v1.3.0',
            'html_url' => 'https://github.com/rexlManu/Dozobin/releases/tag/v1.3.0',
        ]),
    ]);

    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/admin/update-notice/dismiss', ['version' => '1.3.0'])
        ->assertRedirect();

    expect($admin->fresh()->dismissed_update_version)->toBe('1.3.0');

    $this->actingAs($admin)
        ->get('/admin/settings/system')
        ->assertInertia(fn (Assert $page) => $page->where('update.dismissed', true));

    $this->actingAs($otherAdmin)
        ->get('/admin/settings/system')
        ->assertInertia(fn (Assert $page) => $page->where('update.dismissed', false));
});
