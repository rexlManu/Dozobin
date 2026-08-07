<?php

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShareResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class LibraryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('library/index', [
            'shares' => fn () => ShareResource::collection(
                $request->user()->shares()->latest()->get(),
            )->resolve($request),
        ]);
    }
}
