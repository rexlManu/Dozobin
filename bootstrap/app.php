<?php

use App\Http\Middleware\AddResponseHeaders;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\EnsureInstallationIsComplete;
use App\Http\Middleware\EnsureInstallationIsPending;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustHosts();
        $middleware->alias([
            'dozo.token' => AuthenticateApiToken::class,
            'install.pending' => EnsureInstallationIsPending::class,
        ]);
        $middleware->web(prepend: [
            AddResponseHeaders::class,
            EnsureInstallationIsComplete::class,
        ]);
        $middleware->api(prepend: [
            AddResponseHeaders::class,
            EnsureInstallationIsComplete::class,
        ]);
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
