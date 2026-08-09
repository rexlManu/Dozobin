<?php

use App\Models\InstallationSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

const UMAMI_TRACKING_CODE = '<script defer src="https://analytics.scrimora.app/script.js" data-website-id="b0be80b2-1c19-4f3f-b696-3e068cf02c48"></script>';

beforeEach(function (): void {
    InstallationSetting::factory()->create();
    config(['inertia.ssr.enabled' => false]);
});

it('allows an administrator to store an external tracking script', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch('/admin/settings/tracking-code', [
            'trackingCode' => "  \n".UMAMI_TRACKING_CODE."\n  ",
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Tracking code updated.');

    expect(InstallationSetting::current()->tracking_code)->toBe(UMAMI_TRACKING_CODE);
});

it('only allows administrators to update the tracking script', function (): void {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->patch('/admin/settings/tracking-code', ['trackingCode' => UMAMI_TRACKING_CODE])
        ->assertForbidden();

    expect(InstallationSetting::current()->tracking_code)->toBeNull();
});

it('rejects unsafe tracking code', function (string $trackingCode): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from('/admin/settings/system')
        ->patch('/admin/settings/tracking-code', ['trackingCode' => $trackingCode])
        ->assertRedirect('/admin/settings/system')
        ->assertSessionHasErrors('trackingCode');

    expect(InstallationSetting::current()->tracking_code)->toBeNull();
})->with([
    'inline JavaScript' => '<script>alert("tracked")</script>',
    'insecure source' => '<script src="http://analytics.example.com/script.js"></script>',
    'event handler' => '<script src="https://analytics.example.com/script.js" onload="alert(1)"></script>',
    'additional markup' => '<script src="https://analytics.example.com/script.js"></script><img src=x>',
]);

it('renders the validated tracking script in the document head', function (): void {
    InstallationSetting::current()->update(['tracking_code' => UMAMI_TRACKING_CODE]);

    $this->get('/')
        ->assertOk()
        ->assertSee('src="https://analytics.scrimora.app/script.js"', false)
        ->assertSee('data-website-id="b0be80b2-1c19-4f3f-b696-3e068cf02c48"', false);
});

it('does not render malformed tracking code even if the database was changed directly', function (): void {
    InstallationSetting::current()->update([
        'tracking_code' => '<script src="https://analytics.example.com/script.js" onload="alert(1)"></script>',
    ]);

    $this->get('/')
        ->assertOk()
        ->assertDontSee('https://analytics.example.com/script.js', false);
});

it('sends the editable code to administrators as a safe encoded prop', function (): void {
    InstallationSetting::current()->update(['tracking_code' => UMAMI_TRACKING_CODE]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/admin/settings/system')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings/system')
            ->where('trackingCodeBase64', base64_encode(UMAMI_TRACKING_CODE))
            ->missing('config.trackingCode'));
});
