<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class SettingsPageController extends Controller
{
    public function profile(): Response
    {
        return Inertia::render('settings/profile');
    }

    public function appearance(): Response
    {
        return Inertia::render('settings/appearance');
    }

    public function sharing(): Response
    {
        return Inertia::render('settings/sharing');
    }

    public function storage(): Response
    {
        return Inertia::render('settings/storage');
    }

    public function security(): Response
    {
        return Inertia::render('settings/security');
    }

    public function tokens(): Response
    {
        return Inertia::render('settings/tokens');
    }

    public function sharex(): Response
    {
        return Inertia::render('settings/sharex');
    }
}
