<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use App\Services\InstallationState;
use Illuminate\Http\Response;

final class RobotsController extends Controller
{
    public function __invoke(InstallationState $installation): Response
    {
        $indexingEnabled = (bool) config('seo.indexing_enabled') && $installation->isComplete();

        $lines = $indexingEnabled
            ? [
                'User-agent: *',
                'Allow: /',
                'Disallow: /admin/',
                'Disallow: /api/',
                'Disallow: /install/',
                'Disallow: /library',
                'Disallow: /settings/',
                'Disallow: /shares/',
                'Disallow: /transfer-items/',
                '',
                'Sitemap: '.rtrim((string) config('app.url'), '/').'/sitemap.xml',
            ]
            : [
                'User-agent: *',
                'Disallow: /',
            ];

        return response(implode("\n", $lines)."\n", headers: [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
