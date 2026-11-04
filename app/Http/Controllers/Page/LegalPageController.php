<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Terms of Service, Privacy Policy and the takedown form. Public on every installation. */
final class LegalPageController extends Controller
{
    public function terms(): Response
    {
        return Inertia::render('legal/terms');
    }

    public function privacy(): Response
    {
        return Inertia::render('legal/privacy');
    }

    public function takedown(Request $request): Response
    {
        return Inertia::render('legal/takedown', [
            'shareUrl' => $request->string('url')->limit(2048, '')->toString(),
        ]);
    }
}
