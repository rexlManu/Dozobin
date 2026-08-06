<?php

namespace App\Http\Controllers;

use App\Actions\BuildAppStateAction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AppPageController extends Controller
{
    public function __construct(private BuildAppStateAction $state) {}

    public function __invoke(Request $request): Response
    {
        $name = (string) $request->route()?->getName();
        $screen = match (true) {
            $name === 'home' => 'workspace',
            $name === 'library' => 'library',
            $name === 'transfer.lobby' => 'transfer-lobby',
            $name === 'signin' => 'signin',
            $name === 'register' => 'register',
            $name === 'password.request' => 'reset',
            $name === 'states' => 'states',
            str_starts_with($name, 'settings.') => 'settings-'.(string) $request->route('section'),
            str_starts_with($name, 'admin.users.show') => 'admin-user',
            str_starts_with($name, 'admin.users.uploads') => 'admin-user-uploads',
            str_starts_with($name, 'admin.users') => 'admin-users',
            str_starts_with($name, 'admin.uploads') => 'admin-uploads',
            str_starts_with($name, 'admin.sessions') => 'admin-transfers',
            str_starts_with($name, 'admin.settings.') => 'admin-settings-'.(string) $request->route('section'),
            default => 'workspace',
        };

        return Inertia::render('dozobin', [
            'screen' => $screen,
            'routeParams' => (object) $request->route()->parameters(),
            'state' => $this->state->handle($request, admin: str_starts_with($screen, 'admin')),
        ]);
    }
}
