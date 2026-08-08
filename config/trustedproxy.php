<?php

return [
    // Comma-separated proxy IP addresses or CIDR ranges. REMOTE_ADDR is useful
    // when exactly one reverse proxy sits directly in front of the application.
    'proxies' => env('TRUSTED_PROXIES'),
];
