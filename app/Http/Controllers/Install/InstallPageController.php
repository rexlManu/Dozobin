<?php

namespace App\Http\Controllers\Install;

use App\Data\RequirementCheck;
use App\Http\Controllers\Controller;
use App\Http\Resources\InstallationSettingResource;
use App\Models\InstallationSetting;
use App\Services\InstallationState;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class InstallPageController extends Controller
{
    public function __construct(private readonly InstallationState $state) {}

    public function database(): Response
    {
        return Inertia::render('install/database', [
            'database' => fn (): array => $this->state->database()->toArray(),
            'requirements' => fn (): array => array_map(
                fn (RequirementCheck $check): array => $check->toArray(),
                $this->state->requirements(),
            ),
        ]);
    }

    public function account(): Response
    {
        return Inertia::render('install/account');
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('install/settings', [
            // The wizard edits a draft of the same shape the admin area uses,
            // seeded with whatever defaults the settings row was created with.
            'defaults' => fn (): array => (new InstallationSettingResource(InstallationSetting::current()))->resolve($request),
        ]);
    }
}
