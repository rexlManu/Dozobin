<?php

namespace App\Http\Controllers;

use App\Services\FileStoreProbe;
use App\Services\InstallationState;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ReadinessController extends Controller
{
    public function __invoke(InstallationState $installation, FileStoreProbe $probe): JsonResponse
    {
        $database = $installation->database();
        $files = $probe->run();
        $ready = $database->ready() && $files->satisfied;

        return response()->json([
            'ready' => $ready,
            'database' => $database->ready() ? 'ready' : 'unavailable',
            'fileStore' => $files->satisfied ? 'ready' : 'unavailable',
        ], $ready ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
