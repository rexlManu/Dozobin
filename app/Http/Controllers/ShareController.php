<?php

namespace App\Http\Controllers;

use App\Actions\Shares\CreateFileShareAction;
use App\Actions\Shares\CreatePasteAction;
use App\Actions\Shares\DeleteSharesAction;
use App\Http\Requests\DestroySharesRequest;
use App\Http\Requests\StoreFileShareRequest;
use App\Http\Requests\StorePasteRequest;
use App\Http\Resources\ShareResource;
use App\Models\Share;
use Illuminate\Http\JsonResponse;

final class ShareController extends Controller
{
    public function storeFile(StoreFileShareRequest $request, CreateFileShareAction $create): ShareResource
    {
        return ShareResource::make($create->handle($request->user(), $request->toData()));
    }

    public function storePaste(StorePasteRequest $request, CreatePasteAction $create): ShareResource
    {
        return ShareResource::make($create->handle($request->user(), $request->toData()));
    }

    public function destroy(DestroySharesRequest $request, DeleteSharesAction $delete): JsonResponse
    {
        $shares = Share::query()->whereIn('slug', $request->validated('ids'))->get();
        $delete->handle($request->user(), $shares);

        return response()->json(status: 204);
    }
}
