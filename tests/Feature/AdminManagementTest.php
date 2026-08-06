<?php

use App\Enums\UserRole;
use App\Models\InstallationSetting;
use App\Models\User;

beforeEach(fn () => InstallationSetting::factory()->create());

it('protects administration pages', function (): void {
    $this->actingAs(User::factory()->create())->get('/admin/users')->assertForbidden();
    $this->actingAs(User::factory()->admin()->create())->get('/admin/users')->assertOk();
});

it('prevents the last administrator from demoting themselves', function (): void {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/admin/users/{$admin->id}", [
        'role' => UserRole::Member->value,
    ])->assertUnprocessable();

    expect($admin->fresh()->role)->toBe(UserRole::Admin);
});

it('uses a server-backed impersonation session and restores the administrator', function (): void {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $this->actingAs($admin)->postJson("/admin/users/{$member->id}/impersonate")
        ->assertNoContent();
    $this->assertAuthenticatedAs($member);
    expect(session('impersonator_id'))->toBe($admin->id);

    $this->deleteJson('/impersonation')->assertNoContent();
    $this->assertAuthenticatedAs($admin);
    expect(session()->has('impersonator_id'))->toBeFalse();
});
