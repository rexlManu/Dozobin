<?php

namespace App\Actions\Installation;

use App\Services\InstallationState;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Validation\ValidationException;
use Throwable;

final class RunDatabaseMigrationsAction
{
    public function __construct(private InstallationState $state) {}

    public function handle(): void
    {
        $status = $this->state->database();

        if (! $status->connected) {
            throw ValidationException::withMessages([
                'database' => $status->error ?? 'The database could not be reached.',
            ]);
        }

        try {
            Artisan::call('migrate', ['--force' => true]);
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'database' => $exception->getMessage(),
            ]);
        }

        $this->state->refresh();
    }
}
