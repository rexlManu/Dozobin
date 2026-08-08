<?php

namespace App\Http\Controllers\Install;

use App\Actions\Installation\CreateFirstAdministratorAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Install\StoreAdministratorRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

final class AdministratorController extends Controller
{
    public function store(StoreAdministratorRequest $request, CreateFirstAdministratorAction $create): RedirectResponse
    {
        $user = $create->handle([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('install.settings');
    }
}
