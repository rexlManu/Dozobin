<?php

namespace App\Http\Controllers\Install;

use App\Actions\Installation\RunDatabaseMigrationsAction;
use App\Http\Controllers\Controller;
use App\Services\InstallationState;
use Illuminate\Http\RedirectResponse;

final class DatabaseController extends Controller
{
    public function store(RunDatabaseMigrationsAction $migrate, InstallationState $state): RedirectResponse
    {
        $migrate->handle();

        return redirect()->route('install.'.$state->step()->value);
    }
}
