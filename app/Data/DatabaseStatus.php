<?php

namespace App\Data;

final readonly class DatabaseStatus
{
    /** @param list<string> $pendingMigrations */
    public function __construct(
        public bool $connected,
        public string $connection,
        public string $driver,
        public string $database,
        public ?string $host,
        public ?int $port,
        public ?string $error,
        public bool $migrated,
        public array $pendingMigrations,
    ) {}

    public function ready(): bool
    {
        return $this->connected && $this->migrated;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'connected' => $this->connected,
            'connection' => $this->connection,
            'driver' => $this->driver,
            'database' => $this->database,
            'host' => $this->host,
            'port' => $this->port,
            'error' => $this->error,
            'migrated' => $this->migrated,
            'pendingMigrations' => $this->pendingMigrations,
        ];
    }
}
