<?php

use App\Models\InstallationSetting;
use App\Models\InviteCode;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => InstallationSetting::factory()->create([
    'registration' => 'invite',
]));

it('lets administrators create and share a limited invite code', function (): void {
    $admin = User::factory()->admin()->create();
    $expiresAt = now()->addDay()->startOfMinute();

    $this->actingAs($admin)->post('/admin/invites', [
        'name' => 'Design contractors',
        'max_uses' => 4,
        'expires_at' => $expiresAt->toIso8601String(),
    ])->assertRedirect();

    $invite = InviteCode::query()->sole();

    expect($invite->name)->toBe('Design contractors')
        ->and($invite->created_by_user_id)->toBe($admin->id)
        ->and($invite->max_uses)->toBe(4)
        ->and($invite->uses)->toBe(0)
        ->and($invite->expires_at?->equalTo($expiresAt))->toBeTrue()
        ->and($invite->code)->toMatch('/^DOZO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/');

    $this->get('/admin/invites')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/invites/index')
            ->has('invites', 1)
            ->where('invites.0.name', 'Design contractors')
            ->where('invites.0.code', $invite->code)
            ->where('invites.0.maxUses', 4)
            ->where('invites.0.status', 'active')
            ->where('invites.0.shareUrl', route('register', ['invite' => $invite->code])));
});

it('keeps invite management behind administrator authorization', function (): void {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->post('/admin/invites', ['name' => 'Should not exist'])
        ->assertForbidden();

    expect(InviteCode::query()->exists())->toBeFalse();
});

it('prefills the invite from a shared registration link', function (): void {
    $invite = InviteCode::factory()->create();

    $this->get(route('register', ['invite' => $invite->code]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('initialInvite', $invite->code)
            ->where('inviteAvailable', true));
});

it('marks an unavailable shared link before the visitor fills out registration', function (string $state): void {
    $factory = InviteCode::factory();
    $invite = $factory->{$state}()->create();

    $this->get(route('register', ['invite' => $invite->code]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('initialInvite', $invite->code)
            ->where('inviteAvailable', false));
})->with(['expired', 'exhausted', 'revoked']);

it('keeps the legacy environment invite valid during upgrades', function (): void {
    config(['dozobin.invite_code' => 'original-code']);

    $this->get(route('register', ['invite' => 'original-code']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('inviteAvailable', true));

    $this->post('/register', [
        'name' => 'Existing Invite',
        'email' => 'legacy@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'invite' => 'original-code',
    ])->assertRedirect('/');

    expect(User::query()->where('email', 'legacy@example.com')->exists())->toBeTrue();
});

it('consumes an invite atomically when registration succeeds', function (): void {
    $invite = InviteCode::factory()->create(['max_uses' => 1]);

    $this->post('/register', [
        'name' => 'First Member',
        'email' => 'first@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'invite' => strtolower($invite->code),
    ])->assertRedirect('/');

    $member = User::query()->where('email', 'first@example.com')->sole();

    expect($member->invite_code_id)->toBe($invite->id)
        ->and($invite->fresh()->uses)->toBe(1);

    $this->post('/logout');

    $this->post('/register', [
        'name' => 'Second Member',
        'email' => 'second@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'invite' => $invite->code,
    ])->assertSessionHasErrors('invite');

    expect(User::query()->where('email', 'second@example.com')->exists())->toBeFalse()
        ->and($invite->fresh()->uses)->toBe(1);
});

it('rejects unavailable invites', function (string $state): void {
    $factory = InviteCode::factory();
    $invite = $factory->{$state}()->create();

    $this->post('/register', [
        'name' => 'Blocked Member',
        'email' => "{$state}@example.com",
        'password' => 'password',
        'password_confirmation' => 'password',
        'invite' => $invite->code,
    ])->assertSessionHasErrors([
        'invite' => 'That invite code is invalid, expired, or has no uses left.',
    ]);

    expect($invite->fresh()->uses)->toBe($invite->uses);
})->with(['expired', 'exhausted', 'revoked']);

it('lets administrators revoke an invite without deleting its history', function (): void {
    $admin = User::factory()->admin()->create();
    $invite = InviteCode::factory()->for($admin, 'creator')->create();

    $this->actingAs($admin)
        ->delete("/admin/invites/{$invite->id}")
        ->assertRedirect();

    expect($invite->fresh()->revoked_at)->not->toBeNull()
        ->and($invite->fresh()->status())->toBe('revoked');
});
