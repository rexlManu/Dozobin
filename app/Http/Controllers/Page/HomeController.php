<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('workspace');
    }
}
