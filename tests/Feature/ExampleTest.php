<?php

use App\Models\InstallationSetting;

beforeEach(fn () => InstallationSetting::factory()->create());

test('returns a successful response', function () {
    $this->withoutVite();

    $response = $this->get(route('home'));

    $response->assertOk();
});
