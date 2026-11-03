<?php

use App\Data\DeviceDescription;

it('names a device from its user agent', function (string $agent, string $label, bool $isPhone): void {
    $device = DeviceDescription::fromUserAgent($agent);

    expect($device->label())->toBe($label)
        ->and($device->isPhone)->toBe($isPhone);
})->with([
    'iPhone Safari' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'iPhone · Safari', true],
    'Android Chrome' => ['Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36', 'Android phone · Chrome', true],
    'Mac Firefox' => ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:132.0) Gecko/20100101 Firefox/132.0', 'Mac · Firefox', false],
    'Windows Edge' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0', 'Windows PC · Edge', false],
    'unknown' => ['curl/8.0', 'A browser', false],
]);
