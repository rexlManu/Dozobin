<?php

use App\Events\TransferSessionChanged;
use App\Models\InstallationSetting;
use App\Models\TransferActivity;
use App\Models\TransferSession;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    InstallationSetting::factory()->create(['transfer_window_hours' => 4]);
    Storage::fake('local');
});

function useReverb(): void
{
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'dozobin',
    ]);
}

it('tells every device when an item is added, deleted, or a device leaves', function (): void {
    Event::fake([TransferSessionChanged::class]);
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');

    $item = $this->postJson("/transfers/{$code}/items", ['body' => 'Gate 114'])->assertCreated()->json('data.id');
    $this->deleteJson("/transfers/{$code}/items/{$item}")->assertNoContent();
    $this->deleteJson("/transfers/{$code}/leave")->assertNoContent();

    Event::assertDispatchedTimes(TransferSessionChanged::class, 3);
    Event::assertDispatched(TransferSessionChanged::class, fn (TransferSessionChanged $event): bool => $event->accessCode === $code);
});

it('reads the state on a live update without counting it as Session Activity', function (): void {
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');
    $session = TransferSession::query()->where('access_code', $code)->sole();
    $before = $session->last_activity_at;
    $this->travel(5)->minutes();
    Event::fake([TransferSessionChanged::class]);

    $this->get("/transfer/{$code}", [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) Inertia::getVersion(),
        'X-Inertia-Partial-Component' => 'transfers/show',
        'X-Inertia-Partial-Data' => 'transfer',
    ])->assertOk();

    expect($session->fresh()->last_activity_at->equalTo($before))->toBeTrue();
    Event::assertNotDispatched(TransferSessionChanged::class);
});

it('does not log a refresh as a new join', function (): void {
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');
    $this->get("/transfer/{$code}")->assertOk();
    $logged = TransferActivity::query()->count();

    $this->get("/transfer/{$code}")->assertOk();

    expect(TransferActivity::query()->count())->toBe($logged);
});

it('gives the session page the public Reverb key', function (): void {
    useReverb();
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');

    $this->get("/transfer/{$code}")
        ->assertInertia(fn (Assert $page) => $page->where('realtime', 'test-key'));
});

it('authorizes a participant for the presence channel', function (): void {
    useReverb();
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');

    $response = $this->postJson('/transfers/socket-auth', [
        'socket_id' => '1234.5678',
        'channel_name' => "presence-transfer.{$code}",
    ])->assertOk();

    $member = json_decode((string) $response->json('channel_data'), true);
    expect($response->json('auth'))->toStartWith('test-key:')
        ->and($member['user_info']['label'])->toBe('A browser')
        ->and($member['user_info']['id'])->toBe($member['user_id']);
});

it('refuses the presence channel to devices outside the session', function (): void {
    useReverb();
    $code = $this->postJson('/transfers')->assertCreated()->json('data.code');
    $this->deleteJson("/transfers/{$code}/leave")->assertNoContent();

    $this->postJson('/transfers/socket-auth', ['socket_id' => '1.2', 'channel_name' => "presence-transfer.{$code}"])
        ->assertForbidden();
    $this->postJson('/transfers/socket-auth', ['socket_id' => '1.2', 'channel_name' => 'presence-transfer.NOPE0000'])
        ->assertForbidden();
    $this->postJson('/transfers/socket-auth', ['socket_id' => '1.2', 'channel_name' => 'private-App.Models.User.1'])
        ->assertUnprocessable();
});

it('gives every device in a session a distinct, readable name', function (): void {
    $iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
    $code = $this->withHeader('User-Agent', $iphone)->postJson('/transfers')->assertCreated()->json('data.code');

    $this->flushSession();
    $this->withHeader('User-Agent', $iphone)->get("/transfer/{$code}")->assertOk();

    $this->flushSession();
    $member = User::factory()->create(['name' => 'Mika Tanaka']);
    $this->actingAs($member)
        ->withHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:132.0) Gecko/20100101 Firefox/132.0')
        ->get("/transfer/{$code}")->assertOk();

    expect(TransferSession::query()->where('access_code', $code)->sole()->participants()->orderBy('id')->pluck('label')->all())
        ->toBe(['iPhone · Safari', 'iPhone · Safari 2', "Mika's Mac"]);
});
