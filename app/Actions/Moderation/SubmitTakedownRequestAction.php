<?php

namespace App\Actions\Moderation;

use App\Enums\TakedownReason;
use App\Models\Share;
use App\Models\TakedownRequest;

final class SubmitTakedownRequestAction
{
    /**
     * Stores the report and links it to the share when the URL points at one
     * on this installation. Unknown links are still kept for the administrator.
     *
     * @param  array{share_url: string, reason: TakedownReason, details: string, reporter_name: string|null, reporter_email: string}  $data
     */
    public function handle(array $data): TakedownRequest
    {
        return TakedownRequest::query()->create([
            ...$data,
            'share_id' => $this->findShare($data['share_url'])?->id,
        ]);
    }

    private function findShare(string $url): ?Share
    {
        $path = (string) parse_url($url, PHP_URL_PATH);

        if (preg_match('#^/(?:s|p)/([A-Za-z0-9]+)/?$#', $path, $match) !== 1) {
            return null;
        }

        return Share::query()->where('slug', $match[1])->first();
    }
}
