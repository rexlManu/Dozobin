<?php

namespace App\Http\Controllers;

use App\Actions\Accounts\CreateApiTokenAction;
use App\Http\Requests\StoreApiTokenRequest;
use App\Http\Resources\ApiTokenResource;
use App\Models\ApiToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ApiTokenController extends Controller
{
    public function store(StoreApiTokenRequest $request, CreateApiTokenAction $create): ApiTokenResource
    {
        return ApiTokenResource::make($create->handle(
            $request,
            $request->user(),
            $request->string('name')->toString(),
        ));
    }

    public function destroy(Request $request, ApiToken $apiToken): JsonResponse
    {
        $this->authorize('delete', $apiToken);
        $apiToken->update(['revoked_at' => now()]);

        return response()->json(status: 204);
    }
}
