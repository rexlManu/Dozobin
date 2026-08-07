<?php

namespace App\Http\Controllers;

use App\Actions\Accounts\CreateApiTokenAction;
use App\Http\Requests\StoreApiTokenRequest;
use App\Models\ApiToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ApiTokenController extends Controller
{
    public function store(StoreApiTokenRequest $request, CreateApiTokenAction $create): RedirectResponse
    {
        $create->handle(
            $request,
            $request->user(),
            $request->string('name')->toString(),
        );

        return back()->with('status', 'API token created.');
    }

    public function destroy(Request $request, ApiToken $apiToken): RedirectResponse
    {
        $this->authorize('delete', $apiToken);
        $apiToken->update(['revoked_at' => now()]);

        return back()->with('status', 'API token revoked.');
    }
}
