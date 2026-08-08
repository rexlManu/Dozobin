<?php

use App\Models\ApiToken;
use App\Models\InstallationSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => InstallationSetting::factory()->create());

it('renders public pages as dedicated Inertia components', function (string $uri, string $component): void {
    $this->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->missing('state'));
})->with([
    'workspace' => ['/', 'workspace'],
    'sign in' => ['/signin', 'auth/signin'],
    'register' => ['/register', 'auth/register'],
    'password reset' => ['/reset', 'auth/reset'],
    'transfer lobby' => ['/transfer', 'transfers/index'],
]);

it('renders account pages as dedicated Inertia components', function (string $uri, string $component): void {
    $this->actingAs(User::factory()->create())
        ->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->has('auth.user')
            ->missing('state'));
})->with([
    'library' => ['/library', 'library/index'],
    'profile' => ['/settings/profile', 'settings/profile'],
    'appearance' => ['/settings/appearance', 'settings/appearance'],
    'sharing' => ['/settings/sharing', 'settings/sharing'],
    'storage' => ['/settings/storage', 'settings/storage'],
    'security' => ['/settings/security', 'settings/security'],
    'tokens' => ['/settings/tokens', 'settings/tokens'],
    'ShareX' => ['/settings/sharex', 'settings/sharex'],
]);

it('serializes API tokens as a plain list on token-backed settings pages', function (string $uri, string $component): void {
    $user = User::factory()->create();
    $token = ApiToken::factory()->for($user)->create();

    $this->actingAs($user)
        ->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->has('auth.user.tokens', 1)
            ->where('auth.user.tokens.0.id', (string) $token->id)
            ->missing('auth.user.tokens.data'));
})->with([
    'API tokens' => ['/settings/tokens', 'settings/tokens'],
    'ShareX' => ['/settings/sharex', 'settings/sharex'],
]);

it('renders administration pages through Laravel authorization and dedicated components', function (string $uri, string $component): void {
    $this->actingAs(User::factory()->admin()->create())
        ->get($uri)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->missing('state'));
})->with([
    'users' => ['/admin/users', 'admin/users/index'],
    'invites' => ['/admin/invites', 'admin/invites/index'],
    'uploads' => ['/admin/uploads', 'admin/uploads/index'],
    'sessions' => ['/admin/sessions', 'admin/transfers/index'],
    'access' => ['/admin/settings/access', 'admin/settings/access'],
    'expiration' => ['/admin/settings/expiration', 'admin/settings/expiration'],
    'limits' => ['/admin/settings/limits', 'admin/settings/limits'],
    'file types' => ['/admin/settings/file-types', 'admin/settings/file-types'],
    'transfer settings' => ['/admin/settings/transfer', 'admin/settings/transfer'],
    'housekeeping' => ['/admin/settings/housekeeping', 'admin/settings/housekeeping'],
]);

it('renders administrator user detail routes with server-owned records', function (): void {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $this->actingAs($admin)
        ->get("/admin/users/{$member->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/show')
            ->where('account.id', (string) $member->id));

    $this->get("/admin/users/{$member->id}/uploads")
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/uploads')
            ->where('account.id', (string) $member->id));
});

it('uses redirect responses for browser-driven mutations', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch('/profile', ['name' => 'Server State', 'email' => $user->email])
        ->assertRedirect();

    expect($user->fresh()->name)->toBe('Server State');

    $this->post('/transfers')->assertRedirectContains('/transfer/');
});
