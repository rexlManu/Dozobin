<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FileStore;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class AvatarController extends Controller
{
    public function __invoke(User $user, FileStore $files): StreamedResponse
    {
        abort_if($user->avatar_path === null || ! $files->exists($user->avatar_path), 404);

        return $files->response($user->avatar_path, 'avatar', [
            'Content-Type' => $files->mimeType($user->avatar_path),
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
