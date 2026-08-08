<?php

namespace App\Services;

use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;

final class FileResponseFactory
{
    public function __construct(private readonly FileStore $files) {}

    public function inline(string $path, string $name, string $mimeType): Response
    {
        return $this->make($path, $name, $mimeType, 'inline');
    }

    public function download(string $path, string $name, string $mimeType): Response
    {
        return $this->make($path, $name, $mimeType, 'attachment');
    }

    private function make(string $path, string $name, string $mimeType, string $disposition): Response
    {
        $contentDisposition = HeaderUtils::makeDisposition($disposition, $name, 'download');

        if ($this->files->usesS3()) {
            return redirect()->away($this->files->temporaryUrl(
                $path,
                now()->addSeconds((int) config('dozobin.file_store.signed_url_ttl_seconds', 60)),
                [
                    'ResponseContentType' => $mimeType,
                    'ResponseContentDisposition' => $contentDisposition,
                ],
            ));
        }

        return $this->files->response($path, $name, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => $contentDisposition,
        ]);
    }
}
