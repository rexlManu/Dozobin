<?php

namespace App\Http\Middleware;

use App\Services\InstallationState;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Closes the wizard once it has run, and keeps a visitor on the step that is
 * actually outstanding rather than letting them skip ahead to one that cannot
 * be completed yet.
 */
class EnsureInstallationIsPending
{
    public function __construct(private readonly InstallationState $state) {}

    public function handle(Request $request, Closure $next, ?string $step = null): Response
    {
        if ($this->state->isComplete()) {
            return redirect()->route('home');
        }

        $current = $this->state->step();

        if ($step !== null && $step !== $current->value) {
            return redirect()->route('install.'.$current->value);
        }

        return $next($request);
    }
}
