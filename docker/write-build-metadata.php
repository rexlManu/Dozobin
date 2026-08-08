<?php

declare(strict_types=1);

$stringOrNull = static function (string $name): ?string {
    $value = getenv($name);

    return is_string($value) && $value !== '' ? $value : null;
};

$metadata = [
    'version' => $stringOrNull('APP_VERSION') ?? 'dev',
    'commit' => $stringOrNull('APP_COMMIT'),
    'builtAt' => $stringOrNull('APP_BUILT_AT'),
];

$json = json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
file_put_contents(dirname(__DIR__).'/bootstrap/build.json', $json."\n");
