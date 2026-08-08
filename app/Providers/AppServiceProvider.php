<?php

namespace App\Providers;

use App\Contracts\MalwareScanner;
use App\Models\User;
use App\Services\ClamDScanner;
use App\Services\InstallationState;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MalwareScanner::class, ClamDScanner::class);
        $this->app->singleton(InstallationState::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->surviveAnUnpreparedDatabase();
        Gate::define('admin', fn (User $user): bool => $user->isAdmin());
    }

    /**
     * Sessions, the cache and the queue all live in the database by default,
     * and on a first run that database is either unreachable or empty. Either
     * way the wizard could not render the failure it exists to report, so put
     * those three on the filesystem until the schema can carry them.
     */
    protected function surviveAnUnpreparedDatabase(): void
    {
        if ($this->app->runningInConsole()) {
            return;
        }

        $installation = $this->app->make(InstallationState::class);

        if ($installation->isComplete() || $installation->databaseStoresReady()) {
            return;
        }

        config([
            'session.driver' => 'file',
            'cache.default' => 'file',
            'queue.default' => 'sync',
        ]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
