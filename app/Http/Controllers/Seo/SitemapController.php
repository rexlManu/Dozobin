<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use App\Services\InstallationState;
use Illuminate\Http\Request;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use Symfony\Component\HttpFoundation\Response;

final class SitemapController extends Controller
{
    public function __invoke(Request $request, InstallationState $installation): Response
    {
        $sitemap = Sitemap::create();

        if ((bool) config('seo.indexing_enabled') && $installation->isComplete()) {
            $sitemap->add(
                Url::create(rtrim((string) config('app.url'), '/'))
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
                    ->setPriority(1.0),
            );
        }

        $response = $sitemap->toResponse($request);
        $response->setPublic();
        $response->setMaxAge(3600);

        return $response;
    }
}
