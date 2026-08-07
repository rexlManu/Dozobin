<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class AuthPageController extends Controller
{
    public function signIn(): Response
    {
        return Inertia::render('auth/signin');
    }

    public function register(): Response
    {
        return Inertia::render('auth/register');
    }

    public function reset(): Response
    {
        return Inertia::render('auth/reset');
    }
}
