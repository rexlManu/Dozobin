<?php

$build = json_decode((string) file_get_contents(dirname(__DIR__).'/bootstrap/build.json'), true);
$build = is_array($build) ? $build : [];

return [
    'file_store' => [
        'signed_url_ttl_seconds' => (int) env('FILE_STORE_SIGNED_URL_TTL', 60),
    ],

    'release' => [
        'version' => is_string($build['version'] ?? null) ? $build['version'] : 'dev',
        'commit' => is_string($build['commit'] ?? null) ? $build['commit'] : null,
        'built_at' => is_string($build['builtAt'] ?? null) ? $build['builtAt'] : null,
        'repository' => env('DOZOBIN_RELEASE_REPOSITORY', 'rexlManu/Dozobin'),
        'update_checks' => filter_var(env('DOZOBIN_UPDATE_CHECK', true), FILTER_VALIDATE_BOOL),
        'cache_hours' => (int) env('DOZOBIN_UPDATE_CACHE_HOURS', 24),
    ],

    // Transition path for installations upgrading from the original single-code system.
    // Remove it from the environment after issuing managed invites.
    'invite_code' => env('DOZOBIN_INVITE_CODE'),

    'installation' => [
        // Escape hatch for provisioned deployments that set everything up from
        // configuration and never want the wizard to appear.
        'bypass' => filter_var(env('DOZOBIN_SKIP_INSTALLER', false), FILTER_VALIDATE_BOOL),
    ],

    'malware_scanning' => [
        'queue' => env('MALWARE_SCAN_QUEUE', 'scans'),
        'clamd' => [
            'unix_socket' => env('CLAMAV_UNIX_SOCKET'),
            'host' => env('CLAMAV_HOST', '127.0.0.1'),
            'port' => (int) env('CLAMAV_PORT', 3310),
            'connect_timeout_seconds' => (float) env('CLAMAV_CONNECT_TIMEOUT', 2),
            'read_timeout_seconds' => (int) env('CLAMAV_READ_TIMEOUT', 120),
            'chunk_bytes' => (int) env('CLAMAV_STREAM_CHUNK_BYTES', 1048576),
        ],
    ],
];
