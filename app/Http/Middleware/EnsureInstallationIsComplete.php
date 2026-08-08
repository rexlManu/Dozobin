<?php

namespace App\Http\Middleware;

use App\Services\InstallationState;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Holds every ordinary route shut until the wizard has been through.
 */
class EnsureInstallationIsComplete
{
    public function __construct(private readonly InstallationState $state) {}

    public function handle(Request $request, Closure $next): Response
    {
        // The health endpoint sits in the web group too, and an orchestrator
        // polling it during a first boot should not be told to go install.
        if ($request->routeIs('install.*') || $request->is('up')) {
            return $next($request);
        }

        if ($this->state->isComplete()) {
            return $next($request);
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'message' => 'This Dōzobin installation has not been set up yet.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return redirect()->route('install.'.$this->state->step()->value);
    }
}
