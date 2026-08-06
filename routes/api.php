<?php

use App\Http\Controllers\Api\ShareController;
use Illuminate\Support\Facades\Route;

Route::middleware('dozo.token')->prefix('v1')->name('api.')->group(function (): void {
    Route::post('/shares', [ShareController::class, 'store'])->name('shares.store');
    Route::delete('/shares/{share}', [ShareController::class, 'destroy'])->name('shares.destroy');
});
