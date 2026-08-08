<?php

return [
    'description' => env(
        'SEO_DESCRIPTION',
        'Self-hosted file sharing for files, screenshots, and text, with expiring links, password protection, and accountless transfers between devices.',
    ),

    'indexing_enabled' => filter_var(
        env('SEO_INDEX', env('APP_ENV', 'production') === 'production'),
        FILTER_VALIDATE_BOOL,
    ),

    // Use an absolute URL to a social preview image, ideally 1200 x 630 px.
    'image' => env('SEO_IMAGE_URL'),
];
