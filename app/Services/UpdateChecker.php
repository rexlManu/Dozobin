<?php

namespace App\Services;

use App\Data\UpdateStatus;
use App\Models\User;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

final class UpdateChecker
{
    public function status(?User $administrator = null, bool $refresh = false): UpdateStatus
    {
        $currentVersion = (string) config('dozobin.release.version', 'dev');
        $enabled = (bool) config('dozobin.release.update_checks', true)
            && $this->isStableVersion($currentVersion)
            && $this->repository() !== null;

        $release = $enabled ? $this->latestRelease($refresh) : null;
        $latestVersion = is_string($release['version'] ?? null) ? $release['version'] : null;
        $updateAvailable = $latestVersion !== null
            && version_compare($latestVersion, $this->normalize($currentVersion), '>');

        return new UpdateStatus(
            currentVersion: $currentVersion,
            currentCommit: $this->stringConfig('dozobin.release.commit'),
            builtAt: $this->stringConfig('dozobin.release.built_at'),
            latestVersion: $latestVersion,
            releaseUrl: is_string($release['url'] ?? null) ? $release['url'] : null,
            checkedAt: is_int($release['checked_at'] ?? null) ? $release['checked_at'] : null,
            checksEnabled: $enabled,
            updateAvailable: $updateAvailable,
            dismissed: $updateAvailable
                && $administrator?->dismissed_update_version === $latestVersion,
        );
    }

    /** @return array{version: string|null, url: string|null, checked_at: int}|null */
    private function latestRelease(bool $refresh): ?array
    {
        $repository = $this->repository();
        if ($repository === null) {
            return null;
        }

        $key = 'dozobin:update:'.hash('sha256', $repository);
        if ($refresh) {
            Cache::forget($key);
        }

        $cached = Cache::get($key);
        if (is_array($cached)) {
            return $this->releaseArray($cached);
        }

        $release = $this->requestLatestRelease($repository);
        Cache::put(
            $key,
            $release,
            now()->addHours(max(1, (int) config('dozobin.release.cache_hours', 24))),
        );

        return $release;
    }

    /** @return array{version: string|null, url: string|null, checked_at: int} */
    private function requestLatestRelease(string $repository): array
    {
        $result = ['version' => null, 'url' => null, 'checked_at' => now()->getTimestamp()];

        try {
            $response = $this->request()->get("https://api.github.com/repos/{$repository}/releases/latest");
            if (! $response->successful()) {
                return $result;
            }

            $tag = $response->json('tag_name');
            $url = $response->json('html_url');
            if (! is_string($tag) || ! $this->isStableVersion($tag) || ! is_string($url)) {
                return $result;
            }

            return [
                'version' => $this->normalize($tag),
                'url' => $url,
                'checked_at' => $result['checked_at'],
            ];
        } catch (Throwable) {
            return $result;
        }
    }

    private function request(): PendingRequest
    {
        return Http::acceptJson()
            ->withUserAgent('Dozobin-Update-Check')
            ->connectTimeout(3)
            ->timeout(5);
    }

    private function repository(): ?string
    {
        $repository = config('dozobin.release.repository');

        return is_string($repository)
            && preg_match('/\A[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\z/', $repository) === 1
                ? $repository
                : null;
    }

    private function isStableVersion(string $version): bool
    {
        return preg_match('/\Av?\d+\.\d+\.\d+\z/', $version) === 1;
    }

    private function normalize(string $version): string
    {
        return ltrim($version, 'v');
    }

    private function stringConfig(string $key): ?string
    {
        $value = config($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /** @param array<array-key, mixed> $release
     * @return array{version: string|null, url: string|null, checked_at: int}|null
     */
    private function releaseArray(array $release): ?array
    {
        if (! is_int($release['checked_at'] ?? null)) {
            return null;
        }

        return [
            'version' => is_string($release['version'] ?? null) ? $release['version'] : null,
            'url' => is_string($release['url'] ?? null) ? $release['url'] : null,
            'checked_at' => $release['checked_at'],
        ];
    }
}
