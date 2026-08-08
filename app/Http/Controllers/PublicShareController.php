<?php

namespace App\Http\Controllers;

use App\Actions\Shares\UnlockShareAction;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Http\Requests\UnlockShareRequest;
use App\Http\Resources\ShareResource;
use App\Models\Share;
use App\Services\FileResponseFactory;
use App\Services\FileStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

final class PublicShareController extends Controller
{
    public function showFile(Request $request, Share $share): Response
    {
        abort_unless($share->kind === ShareKind::File, 404);
        $this->recordView($request, $share);

        return $this->page($request, $share, 'shares/show');
    }

    public function showPaste(Request $request, Share $share): Response
    {
        abort_unless($share->kind === ShareKind::Paste, 404);
        $this->recordView($request, $share);

        return $this->page($request, $share, 'pastes/show');
    }

    public function unlock(UnlockShareRequest $request, Share $share, UnlockShareAction $unlock): JsonResponse
    {
        $unlock->handle($request, $share, $request->string('password')->toString());

        return response()->json(['unlocked' => true]);
    }

    public function content(Request $request, Share $share, FileStore $files, FileResponseFactory $responses): HttpResponse
    {
        abort_unless($share->kind === ShareKind::File && $share->state === ShareState::Ready && ! $share->hasExpired(), 404);
        abort_unless($this->canRead($request, $share), 403);
        abort_if($share->storage_path === null || ! $files->exists($share->storage_path), 404);

        return $responses->inline(
            $share->storage_path,
            (string) $share->filename,
            (string) $share->mime_type,
        );
    }

    public function download(Request $request, Share $share, FileStore $files, FileResponseFactory $responses): HttpResponse
    {
        abort_unless($share->kind === ShareKind::File && $share->state === ShareState::Ready && ! $share->hasExpired(), 404);
        abort_unless($this->canRead($request, $share), 403);
        abort_if($share->storage_path === null || ! $files->exists($share->storage_path), 404);

        return $responses->download(
            $share->storage_path,
            (string) $share->filename,
            (string) $share->mime_type,
        );
    }

    private function page(Request $request, Share $share, string $screen): Response
    {
        return Inertia::render($screen, [
            'share' => fn () => (new ShareResource($share))->resolve($request),
            'unlocked' => $request->session()->has("share_unlocked_{$share->slug}"),
        ]);
    }

    private function canRead(Request $request, Share $share): bool
    {
        return $share->password === null
            || $request->session()->has("share_unlocked_{$share->slug}")
            || ($request->user() !== null && $request->user()->id === $share->user_id)
            || ($request->user()?->isAdmin() ?? false);
    }

    private function recordView(Request $request, Share $share): void
    {
        if ($this->canRead($request, $share)
            && $share->state === ShareState::Ready
            && ! $share->hasExpired()
            && ! $request->session()->has("share_viewed_{$share->slug}")) {
            $share->increment('views');
            $request->session()->put("share_viewed_{$share->slug}", true);
        }
    }
}
