<?php

use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\InstallationSettingController;
use App\Http\Controllers\Admin\TransferSessionController as AdminTransferSessionController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AppPageController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetLinkController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicShareController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferItemController;
use Illuminate\Support\Facades\Route;

Route::get('/', AppPageController::class)->name('home');
Route::get('/s/{share}', [PublicShareController::class, 'showFile'])->name('shares.show');
Route::get('/p/{share}', [PublicShareController::class, 'showPaste'])->name('pastes.show');
Route::post('/shares/{share}/unlock', [PublicShareController::class, 'unlock'])->middleware('throttle:10,1')->name('shares.unlock');
Route::get('/shares/{share}/content', [PublicShareController::class, 'content'])->name('shares.content');
Route::get('/shares/{share}/download', [PublicShareController::class, 'download'])->name('shares.download');

Route::post('/shares/files', [ShareController::class, 'storeFile'])->middleware('throttle:30,1')->name('shares.files.store');
Route::post('/shares/pastes', [ShareController::class, 'storePaste'])->middleware('throttle:60,1')->name('shares.pastes.store');

Route::get('/transfer', AppPageController::class)->name('transfer.lobby');
Route::post('/transfers', [TransferController::class, 'store'])->middleware('throttle:20,1')->name('transfers.store');
Route::post('/transfers/join', [TransferController::class, 'join'])->middleware('throttle:30,1')->name('transfers.join');
Route::get('/transfer/{transferSession}', [TransferController::class, 'show'])->name('transfers.show');
Route::post('/transfers/{transferSession}/touch', [TransferController::class, 'touch'])->name('transfers.touch');
Route::delete('/transfers/{transferSession}/leave', [TransferController::class, 'leave'])->name('transfers.leave');
Route::post('/transfers/{transferSession}/items', [TransferItemController::class, 'store'])->name('transfer-items.store');
Route::delete('/transfers/{transferSession}/items/{transferItem}', [TransferItemController::class, 'destroy'])->scopeBindings()->name('transfer-items.destroy');
Route::get('/transfer-items/{transferItem}/content', [TransferItemController::class, 'content'])->name('transfer-items.content');

Route::middleware('guest')->group(function (): void {
    Route::get('/signin', AppPageController::class)->name('signin');
    Route::post('/signin', [AuthController::class, 'login'])->name('login');
    Route::get('/register', AppPageController::class)->name('register');
    Route::post('/register', [AuthController::class, 'register'])->name('register.store');
    Route::get('/reset', AppPageController::class)->name('password.request');
    Route::post('/reset', PasswordResetLinkController::class)->middleware('throttle:6,1')->name('password.email');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::delete('/shares', [ShareController::class, 'destroy'])->name('shares.destroy');
    Route::get('/library', AppPageController::class)->name('library');
    Route::get('/settings', fn () => redirect()->route('settings.show', 'profile'));
    Route::get('/settings/{section}', AppPageController::class)
        ->whereIn('section', ['profile', 'appearance', 'sharing', 'storage', 'security', 'tokens', 'sharex'])
        ->name('settings.show');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile/sessions/{session}', [ProfileController::class, 'destroySession'])->name('profile.sessions.destroy');
    Route::delete('/impersonation', [ImpersonationController::class, 'destroy'])->name('impersonation.destroy');
    Route::post('/api-tokens', [ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('/api-tokens/{apiToken}', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
});

Route::middleware(['auth', 'can:admin'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/', fn () => redirect()->route('admin.users.index'));
    Route::get('/users', AppPageController::class)->name('users.index');
    Route::get('/users/{accountId}', AppPageController::class)->name('users.show');
    Route::get('/users/{accountId}/uploads', AppPageController::class)->name('users.uploads');
    Route::get('/uploads', AppPageController::class)->name('uploads.index');
    Route::get('/sessions', AppPageController::class)->name('sessions.index');
    Route::get('/settings/{section}', AppPageController::class)
        ->whereIn('section', ['access', 'expiration', 'limits', 'file-types', 'transfer', 'housekeeping'])
        ->name('settings.show');
    Route::patch('/settings', [InstallationSettingController::class, 'update'])->name('settings.update');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::delete('/users/{user}/sessions/{session}', [AdminUserController::class, 'destroySession'])->name('users.sessions.destroy');
    Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'store'])->name('users.impersonate');
    Route::delete('/sessions/{transferSession}', [AdminTransferSessionController::class, 'destroy'])->name('sessions.destroy');
});

if (app()->isLocal()) {
    Route::get('/states', AppPageController::class)->name('states');
}
