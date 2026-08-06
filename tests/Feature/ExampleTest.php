<?php

test('returns a successful response', function () {
    $this->withoutVite();

    $response = $this->get(route('home'));

    $response->assertOk();
});
