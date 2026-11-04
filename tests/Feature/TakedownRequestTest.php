<?php

use App\Enums\ShareKind;
use App\Enums\TakedownReason;
use App\Enums\TakedownStatus;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\TakedownRequest;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => InstallationSetting::factory()->create());

/** @return array<string, mixed> */
function takedownPayload(array $overrides = []): array
{
    return [
        'share_url' => 'https://dozobin.test/s/doesnotexist',
        'reason' => 'copyright',
        'details' => 'This file is my photo, used without permission.',
        'reporter_name' => 'Aiko Tan',
        'reporter_email' => 'aiko@example.com',
        'good_faith' => true,
        ...$overrides,
    ];
}

it('shows the legal pages to everyone', function (string $uri, string $component): void {
    $this->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'terms' => ['/terms', 'legal/terms'],
    'privacy' => ['/privacy', 'legal/privacy'],
    'takedown' => ['/takedown', 'legal/takedown'],
]);

it('prefills the takedown form with the reported link', function (): void {
    $this->get('/takedown?url='.urlencode('https://dozobin.test/p/abc'))
        ->assertInertia(fn (Assert $page) => $page->where('shareUrl', 'https://dozobin.test/p/abc'));
});

it('stores a report from a guest and links it to the share', function (): void {
    $share = Share::factory()->create(['kind' => ShareKind::Paste]);

    $this->post('/takedown', takedownPayload(['share_url' => $share->url(), 'reason' => 'privacy']))
        ->assertRedirect()
        ->assertSessionHas('status');

    $report = TakedownRequest::query()->sole();
    expect($report->share_id)->toBe($share->id)
        ->and($report->reason)->toBe(TakedownReason::Privacy)
        ->and($report->status)->toBe(TakedownStatus::Open);
});

it('keeps a report for a link that matches no share', function (): void {
    $this->post('/takedown', takedownPayload())->assertSessionHasNoErrors();

    expect(TakedownRequest::query()->sole()->share_id)->toBeNull();
});

it('rejects a report without the good faith statement or an email', function (): void {
    $this->post('/takedown', takedownPayload(['good_faith' => false, 'reporter_email' => '']))
        ->assertSessionHasErrors(['good_faith', 'reporter_email']);

    expect(TakedownRequest::query()->count())->toBe(0);
});

it('limits how often one visitor can send reports', function (): void {
    foreach (range(1, 5) as $attempt) {
        $this->post('/takedown', takedownPayload())->assertSessionHasNoErrors();
    }

    $this->post('/takedown', takedownPayload())->assertTooManyRequests();
});

it('lists reports for administrators only', function (): void {
    TakedownRequest::factory()->count(2)->create();

    $this->actingAs(User::factory()->create())->get('/admin/reports')->assertForbidden();

    $this->actingAs(User::factory()->admin()->create())
        ->get('/admin/reports')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reports/index')
            ->has('reports', 2)
            ->where('openReports', 2));
});

it('lets an administrator dismiss a report and open it again', function (): void {
    $admin = User::factory()->admin()->create();
    $report = TakedownRequest::factory()->create();

    $this->actingAs($admin)->patch("/admin/reports/{$report->id}", ['status' => 'dismissed'])->assertRedirect();
    expect($report->refresh())
        ->status->toBe(TakedownStatus::Dismissed)
        ->handled_by_user_id->toBe($admin->id);

    $this->actingAs($admin)->patch("/admin/reports/{$report->id}", ['status' => 'open']);
    expect($report->refresh())
        ->status->toBe(TakedownStatus::Open)
        ->handled_at->toBeNull();
});

it('removes the reported share and resolves the report', function (): void {
    $admin = User::factory()->admin()->create();
    $share = Share::factory()->create();
    $report = TakedownRequest::factory()->forShare($share)->create();

    $this->actingAs($admin)
        ->patch("/admin/reports/{$report->id}", ['status' => 'resolved', 'remove_share' => true])
        ->assertRedirect();

    expect(Share::query()->find($share->id))->toBeNull()
        ->and($report->refresh())
        ->status->toBe(TakedownStatus::Resolved)
        ->share_id->toBeNull()
        ->share_url->toBe($share->url());
});

it('does not let a member change a report', function (): void {
    $report = TakedownRequest::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patch("/admin/reports/{$report->id}", ['status' => 'dismissed'])
        ->assertForbidden();
});
