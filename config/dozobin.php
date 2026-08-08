<?php

return [
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
