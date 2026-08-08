<?php

namespace App\Services;

use App\Data\DatabaseStatus;
use App\Data\RequirementCheck;
use App\Enums\InstallStep;
use App\Enums\UserRole;
use App\Models\InstallationSetting;
use App\Models\User;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Answers "has this installation been set up yet, and if not, what is missing".
 *
 * Everything here has to survive an unreachable database, because a database
 * that cannot be reached is the first thing the wizard is meant to report.
 */
final class InstallationState
{
    private const REQUIRED_PHP = '8.5';

    /** @var list<string> */
    private const REQUIRED_EXTENSIONS = [
        'ctype', 'fileinfo', 'json', 'mbstring', 'openssl', 'pdo', 'tokenizer', 'xml',
    ];

    private ?bool $complete = null;

    private ?DatabaseStatus $database = null;

    private ?bool $storesReady = null;

    private ?RequirementCheck $fileStore = null;

    public function __construct(
        private readonly Migrator $migrator,
        private readonly FileStoreProbe $fileStoreProbe,
    ) {}

    /**
     * A finished installation is recorded on the settings row rather than on
     * disk, because in a container the database is the volume that survives.
     */
    public function isComplete(): bool
    {
        return $this->complete ??= $this->resolveComplete();
    }

    public function step(): InstallStep
    {
        if ($this->isComplete()) {
            return InstallStep::Done;
        }

        if (! $this->database()->ready() || ! $this->fileStore()->satisfied) {
            return InstallStep::Database;
        }

        return $this->hasAdministrator() ? InstallStep::Settings : InstallStep::Account;
    }

    public function database(): DatabaseStatus
    {
        return $this->database ??= $this->resolveDatabase();
    }

    /**
     * Whether the database can already back sessions and the cache. False on a
     * first run whether the server is down or merely empty: an unmigrated
     * schema has no sessions table to write to.
     */
    public function databaseStoresReady(): bool
    {
        return $this->storesReady ??= $this->resolveStoresReady();
    }

    public function hasAdministrator(): bool
    {
        try {
            return User::query()->where('role', UserRole::Admin)->exists();
        } catch (Throwable) {
            return false;
        }
    }

    public function fileStore(): RequirementCheck
    {
        return $this->fileStore ??= $this->fileStoreProbe->run();
    }

    /** @return list<RequirementCheck> */
    public function requirements(): array
    {
        $missingExtensions = array_values(array_filter(
            self::REQUIRED_EXTENSIONS,
            fn (string $extension): bool => ! extension_loaded($extension),
        ));

        $unwritable = array_keys(array_filter(
            [
                'storage/framework' => storage_path('framework'),
                'storage/logs' => storage_path('logs'),
                'bootstrap/cache' => base_path('bootstrap/cache'),
            ],
            fn (string $path): bool => ! is_dir($path) || ! is_writable($path),
        ));

        return [
            new RequirementCheck(
                'PHP '.self::REQUIRED_PHP.' or newer',
                version_compare(PHP_VERSION, self::REQUIRED_PHP, '>='),
                'Running PHP '.PHP_VERSION,
            ),
            new RequirementCheck(
                'PHP extensions',
                $missingExtensions === [],
                $missingExtensions === []
                    ? 'All required extensions are loaded'
                    : 'Missing: '.implode(', ', $missingExtensions),
            ),
            new RequirementCheck(
                'Writable directories',
                $unwritable === [],
                $unwritable === []
                    ? 'storage/ and bootstrap/cache accept writes'
                    : 'Not writable: '.implode(', ', $unwritable),
            ),
            new RequirementCheck(
                'Application key',
                is_string(config('app.key')) && config('app.key') !== '',
                is_string(config('app.key')) && config('app.key') !== ''
                    ? 'APP_KEY is set'
                    : 'Set APP_KEY, or run php artisan key:generate',
            ),
            $this->fileStore(),
        ];
    }

    /** Forget everything cached for this request, after the wizard changed something. */
    public function refresh(): void
    {
        $this->complete = null;
        $this->database = null;
        $this->storesReady = null;
        $this->fileStore = null;
    }

    private function resolveStoresReady(): bool
    {
        try {
            $schema = DB::connection()->getSchemaBuilder();

            return $schema->hasTable('sessions') && $schema->hasTable('cache');
        } catch (Throwable) {
            return false;
        }
    }

    private function resolveComplete(): bool
    {
        if ((bool) config('dozobin.installation.bypass') === true) {
            return true;
        }

        try {
            return InstallationSetting::query()->whereNotNull('installed_at')->exists();
        } catch (Throwable) {
            // No connection, or the table does not exist yet. Either way there is
            // nothing installed to find.
            return false;
        }
    }

    private function resolveDatabase(): DatabaseStatus
    {
        $name = (string) config('database.default');
        /** @var array<string, mixed> $config */
        $config = config("database.connections.{$name}", []);

        $connected = true;
        $error = null;

        try {
            DB::connection($name)->getPdo();
        } catch (Throwable $exception) {
            $connected = false;
            $error = $this->redact($exception->getMessage(), $config);
        }

        $pending = $connected ? $this->pendingMigrations() : null;

        return new DatabaseStatus(
            connected: $connected,
            connection: $name,
            driver: (string) ($config['driver'] ?? $name),
            database: (string) ($config['database'] ?? ''),
            host: isset($config['host']) ? (string) $config['host'] : null,
            port: isset($config['port']) ? (int) $config['port'] : null,
            error: $error,
            migrated: $pending === [],
            pendingMigrations: $pending ?? [],
        );
    }

    /** @return list<string>|null Null when the migration state cannot be read at all. */
    private function pendingMigrations(): ?array
    {
        try {
            $files = array_keys($this->migrator->getMigrationFiles(database_path('migrations')));
            $ran = $this->migrator->repositoryExists() ? $this->migrator->getRepository()->getRan() : [];

            return array_values(array_diff($files, $ran));
        } catch (Throwable) {
            return null;
        }
    }

    /** @param array<string, mixed> $config */
    private function redact(string $message, array $config): string
    {
        $password = $config['password'] ?? null;

        return is_string($password) && $password !== ''
            ? str_replace($password, '••••••', $message)
            : $message;
    }
}
