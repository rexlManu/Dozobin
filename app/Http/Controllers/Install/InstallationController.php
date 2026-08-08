<?php

namespace App\Http\Controllers\Install;

use App\Actions\Installation\CompleteInstallationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Install\CompleteInstallationRequest;
use Illuminate\Http\RedirectResponse;

final class InstallationController extends Controller
{
    public function store(CompleteInstallationRequest $request, CompleteInstallationAction $complete): RedirectResponse
    {
        $complete->handle($request->validated());

        return redirect()
            ->route('home')
            ->with('status', 'Dōzobin is installed. Everything here is editable again under Administration.');
    }
}
