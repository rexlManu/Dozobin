<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AddResponseHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(self), geolocation=(), microphone=()');

        if ($request->routeIs('shares.content', 'transfer-items.content')) {
            // Uploaded content keeps an opaque origin if a browser renders it as
            // HTML or SVG, while images, media, PDFs and text previews still work.
            $response->headers->set(
                'Content-Security-Policy',
                "sandbox; default-src 'none'; img-src data: blob:; media-src blob:; style-src 'unsafe-inline'",
            );
        } else {
            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set(
                'Content-Security-Policy',
                "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
            );
        }

        if ($request->isSecure() && app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        if (! $request->routeIs('seo.*') && ! $request->is('up')) {
            $robots = (bool) config('seo.indexing_enabled')
                && $request->routeIs('home')
                && $response->isSuccessful()
                ? 'index, follow'
                : 'noindex, nofollow, noarchive';

            $response->headers->set('X-Robots-Tag', $robots);
        }

        return $response;
    }
}
