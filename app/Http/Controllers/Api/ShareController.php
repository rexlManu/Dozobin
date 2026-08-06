<?php

namespace App\Http\Controllers\Api;

use App\Actions\Shares\CreateFileShareAction;
use App\Actions\Shares\DeleteSharesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFileShareRequest;
use App\Models\Share;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ShareController extends Controller
{
    public function store(StoreFileShareRequest $request, CreateFileShareAction $create): JsonResponse
    {
        $share = $create->handle($request->user(), $request->toData());

        return response()->json([
            'id' => $share->slug,
            'url' => route('shares.show', $share),
            'delete_url' => route('api.shares.destroy', $share),
        ], 201);
    }

    public function destroy(Request $request, Share $share, DeleteSharesAction $delete): JsonResponse
    {
        $delete->handle($request->user(), collect([$share]));

        return response()->json(status: 204);
    }
}
