<?php

use App\Http\Controllers\Admin\ExpiredSharePayloadController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\Admin\InstallationSettingController;
use App\Http\Controllers\Admin\InviteCodeController;
use App\Http\Controllers\Admin\MalwareScanController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\TransferSessionController as AdminTransferSessionController;
use App\Http\Controllers\Admin\UpdateNoticeController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\Install\AdministratorController;
use App\Http\Controllers\Install\DatabaseController as InstallDatabaseController;
use App\Http\Controllers\Install\InstallationController;
use App\Http\Controllers\Install\InstallPageController;
use App\Http\Controllers\Page\AuthPageController;
use App\Http\Controllers\Page\HomeController;
use App\Http\Controllers\Page\LibraryController;
use App\Http\Controllers\Page\SettingsPageController;
use App\Http\Controllers\PasswordResetLinkController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicShareController;
use App\Http\Controllers\ReadinessController;
use App\Http\Controllers\Seo\RobotsController;
use App\Http\Controllers\Seo\SitemapController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferItemController;
use Illuminate\Support\Facades\Route;

Route::get('/robots.txt', RobotsController::class)->name('seo.robots');
Route::get('/sitemap.xml', SitemapController::class)->name('seo.sitemap');
Route::get('/ready', ReadinessController::class)->name('ready');

/*
 * First run. Every other route redirects here until the wizard finishes, and
 * this group closes the moment it does.
 */
Route::prefix('install')->name('install.')->group(function (): void {
    Route::redirect('/', '/install/database')->middleware('install.pending');
    Route::get('/database', [InstallPageController::class, 'database'])->middleware('install.pending:database')->name('database');
    Route::post('/database', [InstallDatabaseController::class, 'store'])->middleware(['install.pending:database', 'throttle:10,1'])->name('database.store');
    Route::get('/account', [InstallPageController::class, 'account'])->middleware('install.pending:account')->name('account');
    Route::post('/account', [AdministratorController::class, 'store'])->middleware(['install.pending:account', 'throttle:10,1'])->name('account.store');
    Route::get('/settings', [InstallPageController::class, 'settings'])->middleware('install.pending:settings')->name('settings');
    Route::post('/settings', [InstallationController::class, 'store'])->middleware('install.pending:settings')->name('settings.store');
});

Route::get('/', HomeController::class)->name('home');
Route::get('/s/{share}', [PublicShareController::class, 'showFile'])->name('shares.show');
Route::get('/p/{share}', [PublicShareController::class, 'showPaste'])->name('pastes.show');
Route::get('/avatars/{user}', AvatarController::class)->name('avatars.show');
Route::post('/shares/{share}/unlock', [PublicShareController::class, 'unlock'])->middleware('throttle:10,1')->name('shares.unlock');
Route::get('/shares/{share}/content', [PublicShareController::class, 'content'])->name('shares.content');
Route::get('/shares/{share}/download', [PublicShareController::class, 'download'])->name('shares.download');

Route::post('/shares/files', [ShareController::class, 'storeFile'])->middleware('throttle:30,1')->name('shares.files.store');
Route::post('/shares/pastes', [ShareController::class, 'storePaste'])->middleware('throttle:60,1')->name('shares.pastes.store');

Route::get('/transfer', [TransferController::class, 'index'])->name('transfer.lobby');
Route::post('/transfers', [TransferController::class, 'store'])->middleware('throttle:20,1')->name('transfers.store');
Route::post('/transfers/join', [TransferController::class, 'join'])->middleware('throttle:30,1')->name('transfers.join');
Route::get('/transfer/{transferSession}', [TransferController::class, 'show'])->name('transfers.show');
Route::post('/transfers/{transferSession}/touch', [TransferController::class, 'touch'])->name('transfers.touch');
Route::delete('/transfers/{transferSession}/leave', [TransferController::class, 'leave'])->name('transfers.leave');
Route::post('/transfers/{transferSession}/items', [TransferItemController::class, 'store'])->name('transfer-items.store');
Route::delete('/transfers/{transferSession}/items/{transferItem}', [TransferItemController::class, 'destroy'])->scopeBindings()->name('transfer-items.destroy');
Route::get('/transfer-items/{transferItem}/content', [TransferItemController::class, 'content'])->name('transfer-items.content');

Route::middleware('guest')->group(function (): void {
    Route::get('/signin', [AuthPageController::class, 'signIn'])->name('signin');
    Route::post('/signin', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login');
    Route::get('/register', [AuthPageController::class, 'register'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1')->name('register.store');
    Route::get('/reset', [AuthPageController::class, 'reset'])->name('password.request');
    Route::post('/reset', PasswordResetLinkController::class)->middleware('throttle:6,1')->name('password.email');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::delete('/shares', [ShareController::class, 'destroy'])->name('shares.destroy');
    Route::get('/library', LibraryController::class)->name('library');
    Route::redirect('/settings', '/settings/profile');
    Route::get('/settings/profile', [SettingsPageController::class, 'profile'])->name('settings.profile');
    Route::get('/settings/appearance', [SettingsPageController::class, 'appearance'])->name('settings.appearance');
    Route::get('/settings/sharing', [SettingsPageController::class, 'sharing'])->name('settings.sharing');
    Route::get('/settings/storage', [SettingsPageController::class, 'storage'])->name('settings.storage');
    Route::get('/settings/security', [SettingsPageController::class, 'security'])->name('settings.security');
    Route::get('/settings/tokens', [SettingsPageController::class, 'tokens'])->name('settings.tokens');
    Route::get('/settings/sharex', [SettingsPageController::class, 'sharex'])->name('settings.sharex');
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
    Route::get('/users', [AdminPageController::class, 'users'])->name('users.index');
    Route::get('/invites', [AdminPageController::class, 'invites'])->name('invites.index');
    Route::post('/invites', [InviteCodeController::class, 'store'])->name('invites.store');
    Route::delete('/invites/{inviteCode}', [InviteCodeController::class, 'destroy'])->name('invites.destroy');
    Route::get('/users/{user}', [AdminPageController::class, 'user'])->name('users.show');
    Route::get('/users/{user}/uploads', [AdminPageController::class, 'userUploads'])->name('users.uploads');
    Route::get('/uploads', [AdminPageController::class, 'uploads'])->name('uploads.index');
    Route::get('/sessions', [AdminPageController::class, 'transfers'])->name('sessions.index');
    Route::get('/settings/access', [AdminPageController::class, 'access'])->name('settings.access');
    Route::get('/settings/expiration', [AdminPageController::class, 'expiration'])->name('settings.expiration');
    Route::get('/settings/limits', [AdminPageController::class, 'limits'])->name('settings.limits');
    Route::get('/settings/file-types', [AdminPageController::class, 'fileTypes'])->name('settings.file-types');
    Route::get('/settings/transfer', [AdminPageController::class, 'transferSettings'])->name('settings.transfer');
    Route::get('/settings/housekeeping', [AdminPageController::class, 'housekeeping'])->name('settings.housekeeping');
    Route::get('/settings/system', [AdminPageController::class, 'system'])->name('settings.system');
    Route::patch('/settings', [InstallationSettingController::class, 'update'])->name('settings.update');
    Route::post('/update-notice/dismiss', [UpdateNoticeController::class, 'store'])->name('update-notice.dismiss');
    Route::post('/housekeeping/expired-share-payloads', [ExpiredSharePayloadController::class, 'store'])->name('housekeeping.expired-share-payloads.store');
    Route::post('/uploads/{share}/malware-scan', [MalwareScanController::class, 'store'])->name('uploads.malware-scan.store');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::delete('/users/{user}/sessions/{session}', [AdminUserController::class, 'destroySession'])->name('users.sessions.destroy');
    Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'store'])->name('users.impersonate');
    Route::delete('/sessions/{transferSession}', [AdminTransferSessionController::class, 'destroy'])->name('sessions.destroy');
});
