<?php

namespace App\Http\Middleware;

use App\Http\Resources\InstallationSettingResource;
use App\Http\Resources\UserResource;
use App\Models\InstallationSetting;
use App\Models\User;
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
            'config' => fn () => (new InstallationSettingResource(InstallationSetting::current()))->resolve($request),
            'appearance' => $user?->appearance->value ?? 'system',
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
