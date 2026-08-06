<?php

use App\Models\InstallationSetting;
use App\Models\Share;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => InstallationSetting::factory()->create());

it('hides protected paste contents until the session unlocks it', function (): void {
    $share = Share::factory()->protected('correct horse')->create([
        'body' => 'The hidden body',
        'size_bytes' => 15,
        'views' => 0,
    ]);

    $this->get("/p/{$share->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dozobin')
            ->where('state.shares.0.body', '')
            ->where('state.shares.0.password', 'protected'));

    expect($share->fresh()->views)->toBe(0);

    $this->postJson("/shares/{$share->slug}/unlock", ['password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');

    $this->postJson("/shares/{$share->slug}/unlock", ['password' => 'correct horse'])
        ->assertOk();

    $this->get("/p/{$share->slug}")
        ->assertInertia(fn (Assert $page) => $page->where('state.shares.0.body', 'The hidden body'));

    expect($share->fresh()->views)->toBe(1);
});

it('does not expose protected file metadata or content', function (): void {
    $share = Share::factory()->file()->protected()->create([
        'filename' => 'confidential.pdf',
        'storage_path' => 'shares/confidential.pdf',
    ]);

    $this->get("/s/{$share->slug}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('state.shares.0.filename', '')
            ->where('state.shares.0.size', 0));

    $this->get("/shares/{$share->slug}/content")->assertForbidden();
});
