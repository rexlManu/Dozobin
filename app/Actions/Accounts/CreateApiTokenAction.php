<?php

namespace App\Actions\Accounts;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class CreateApiTokenAction
{
    public function handle(Request $request, User $user, string $name): ApiToken
    {
        $plain = 'dozo_'.Str::random(40);
        $token = $user->apiTokens()->create([
            'name' => $name,
            'token_hash' => hash('sha256', $plain),
            'token_preview' => substr($plain, 0, 10).'…',
        ]);
        $request->session()->put("api_token_secret_{$token->id}", $plain);

        return $token;
    }
}
