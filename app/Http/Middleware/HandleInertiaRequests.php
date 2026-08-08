<?php

namespace App\Http\Middleware;

use App\Http\Resources\InstallationSettingResource;
use App\Http\Resources\UserResource;
use App\Models\InstallationSetting;
use App\Models\User;
use App\Services\InstallationState;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Lab404\Impersonate\Services\ImpersonateManager;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(private readonly InstallationState $installation) {}

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $impersonation = app(ImpersonateManager::class);
        $impersonator = $impersonation->isImpersonating()
            ? $impersonation->getImpersonator()
            : null;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => fn () => $user === null
                    ? null
                    : (new UserResource($user->load('apiTokens')))->resolve($request),
                'impersonator' => fn () => $impersonator instanceof User
                    ? (new UserResource($impersonator->load('apiTokens')))->resolve($request)
                    : null,
            ],
            // During the wizard there may be no settings row, and there may be
            // no database to look for one in, so hand out the defaults instead.
            'config' => fn () => (new InstallationSettingResource(
                $this->installation->isComplete()
                    ? InstallationSetting::current()
                    : new InstallationSetting(InstallationSetting::defaults()),
            ))->resolve($request),
            'installation' => fn (): array => [
                'complete' => $this->installation->isComplete(),
                'step' => $this->installation->step()->value,
            ],
            'appearance' => $user?->appearance->value ?? 'system',
            'seo' => fn (): array => $this->seo($request),
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }

    /** @return array{description: string, robots: string, canonical: string|null, image: string|null} */
    private function seo(Request $request): array
    {
        $indexable = (bool) config('seo.indexing_enabled') && $request->routeIs('home');
        $image = config('seo.image');

        return [
            'description' => (string) config('seo.description'),
            'robots' => $indexable ? 'index, follow' : 'noindex, nofollow, noarchive',
            'canonical' => $indexable ? rtrim((string) config('app.url'), '/') : null,
            'image' => is_string($image) && $image !== '' ? $image : null,
        ];
    }
}
