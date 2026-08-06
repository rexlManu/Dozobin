<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateApiToken
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();
        abort_unless(is_string($plain) && str_starts_with($plain, 'dozo_'), 401, 'A valid API token is required.');

        $token = ApiToken::query()
            ->with('user')
            ->where('token_hash', hash('sha256', $plain))
            ->whereNull('revoked_at')
            ->first();

        abort_unless($token !== null && $token->user->status === UserStatus::Active, 401, 'A valid API token is required.');

        $token->update(['last_used_at' => now()]);
        $request->setUserResolver(fn () => $token->user);

        return $next($request);
    }
}
