<?php

namespace App\Services;

use App\Exceptions\FileStoreUnavailableException;
use DateTimeInterface;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class FileStore
{
    public function diskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    public function driver(): string
    {
        return (string) config("filesystems.disks.{$this->diskName()}.driver", $this->diskName());
    }

    public function usesS3(): bool
    {
        return $this->driver() === 's3';
    }

    public function storeAs(UploadedFile $file, string $directory, string $name): string
    {
        return $this->attempt(function () use ($file, $directory, $name): string {
            $path = $this->disk()->putFileAs($directory, $file, $name);
            if (! is_string($path)) {
                throw new RuntimeException('The uploaded file could not be stored.');
            }

            return $path;
        });
    }

    public function store(UploadedFile $file, string $directory): string
    {
        return $this->attempt(function () use ($file, $directory): string {
            $path = $this->disk()->putFile($directory, $file);
            if (! is_string($path)) {
                throw new RuntimeException('The uploaded file could not be stored.');
            }

            return $path;
        });
    }

    public function put(string $path, string $contents): void
    {
        $this->attempt(function () use ($path, $contents): void {
            if (! $this->disk()->put($path, $contents)) {
                throw new RuntimeException('The object could not be written.');
            }
        });
    }

    public function get(string $path): string
    {
        return $this->attempt(fn (): string => $this->disk()->get($path));
    }

    public function exists(string $path): bool
    {
        return $this->attempt(fn (): bool => $this->disk()->exists($path));
    }

    public function delete(string $path): void
    {
        $this->attempt(function () use ($path): void {
            if (! $this->disk()->delete($path)) {
                throw new RuntimeException('The object could not be deleted.');
            }
        });
    }

    /** @return resource */
    public function readStream(string $path)
    {
        return $this->attempt(function () use ($path) {
            $stream = $this->disk()->readStream($path);
            if (! is_resource($stream)) {
                throw new RuntimeException('The object could not be opened.');
            }

            return $stream;
        });
    }

    /** @param array<string, string> $headers */
    public function response(string $path, string $name, array $headers = []): StreamedResponse
    {
        return $this->attempt(fn (): StreamedResponse => $this->disk()->response($path, $name, $headers));
    }

    /** @param array<string, string> $options */
    public function temporaryUrl(string $path, DateTimeInterface $expiresAt, array $options = []): string
    {
        return $this->attempt(fn (): string => $this->disk()->temporaryUrl($path, $expiresAt, $options));
    }

    public function mimeType(string $path): string
    {
        return $this->attempt(function () use ($path): string {
            $mimeType = $this->disk()->mimeType($path);

            return is_string($mimeType) && $mimeType !== '' ? $mimeType : 'application/octet-stream';
        });
    }

    private function disk(): FilesystemAdapter
    {
        return Storage::disk($this->diskName());
    }

    /**
     * @template TValue
     *
     * @param  callable(): TValue  $operation
     * @return TValue
     */
    private function attempt(callable $operation): mixed
    {
        try {
            return $operation();
        } catch (FileStoreUnavailableException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw FileStoreUnavailableException::causedBy($exception);
        }
    }
}
