<?php

namespace App\Services;

use App\Contracts\MalwareScanner;
use App\Data\MalwareScanResult;
use App\Enums\MalwareScanVerdict;
use App\Exceptions\MalwareScannerException;
use Throwable;

final class ClamDScanner implements MalwareScanner
{
    public function isHealthy(): bool
    {
        try {
            $socket = $this->connect();
            $this->writeAll($socket, "zPING\0");
            $reply = $this->readReply($socket);
            fclose($socket);

            return $reply === 'PONG';
        } catch (Throwable) {
            return false;
        }
    }

    public function scan($payload): MalwareScanResult
    {
        if (! is_resource($payload)) {
            throw new MalwareScannerException('The payload stream is not readable.');
        }

        $socket = $this->connect();

        try {
            $this->writeAll($socket, "zINSTREAM\0");
            $chunkSize = max(1, (int) config('dozobin.malware_scanning.clamd.chunk_bytes', 1048576));

            while (! feof($payload)) {
                $chunk = fread($payload, $chunkSize);
                if ($chunk === false) {
                    throw new MalwareScannerException('The payload could not be read for scanning.');
                }
                if ($chunk === '') {
                    continue;
                }

                $this->writeAll($socket, pack('N', strlen($chunk)).$chunk);
            }

            $this->writeAll($socket, pack('N', 0));
            $reply = $this->readReply($socket);
        } finally {
            fclose($socket);
        }

        if ($reply === 'stream: OK') {
            return new MalwareScanResult(MalwareScanVerdict::Clean);
        }

        if (preg_match('/\Astream: (.+) FOUND\z/', $reply, $matches) === 1) {
            return new MalwareScanResult(MalwareScanVerdict::Detected, $matches[1]);
        }

        throw new MalwareScannerException("ClamAV could not scan the payload: {$reply}");
    }

    /** @return resource */
    private function connect()
    {
        $errorNumber = 0;
        $errorMessage = '';
        $timeout = (float) config('dozobin.malware_scanning.clamd.connect_timeout_seconds', 2);
        $socket = @stream_socket_client(
            $this->endpoint(),
            $errorNumber,
            $errorMessage,
            $timeout,
            STREAM_CLIENT_CONNECT,
        );

        if ($socket === false) {
            throw new MalwareScannerException("ClamAV is unavailable: {$errorMessage}", $errorNumber);
        }

        stream_set_timeout($socket, (int) config('dozobin.malware_scanning.clamd.read_timeout_seconds', 120));

        return $socket;
    }

    private function endpoint(): string
    {
        $unixSocket = config('dozobin.malware_scanning.clamd.unix_socket');
        if (is_string($unixSocket) && $unixSocket !== '') {
            return "unix://{$unixSocket}";
        }

        $host = (string) config('dozobin.malware_scanning.clamd.host', '127.0.0.1');
        $port = (int) config('dozobin.malware_scanning.clamd.port', 3310);

        return "tcp://{$host}:{$port}";
    }

    /** @param resource $socket */
    private function writeAll($socket, string $data): void
    {
        $written = 0;
        $length = strlen($data);

        while ($written < $length) {
            $bytes = fwrite($socket, substr($data, $written));
            if ($bytes === false || $bytes === 0) {
                throw new MalwareScannerException('The connection to ClamAV closed while sending data.');
            }
            $written += $bytes;
        }
    }

    /** @param resource $socket */
    private function readReply($socket): string
    {
        $reply = '';

        while (! feof($socket)) {
            $chunk = fread($socket, 4096);
            if ($chunk === false) {
                throw new MalwareScannerException('The ClamAV response could not be read.');
            }

            $reply .= $chunk;
            if (str_contains($reply, "\0")) {
                break;
            }

            $metadata = stream_get_meta_data($socket);
            if ($metadata['timed_out']) {
                throw new MalwareScannerException('ClamAV timed out while scanning the payload.');
            }
        }

        $record = strtok($reply, "\0");
        $reply = trim($record === false ? '' : $record);
        if ($reply === '') {
            throw new MalwareScannerException('ClamAV returned an empty response.');
        }

        return $reply;
    }
}
