<?php

namespace App\Actions\Shares;

use App\Contracts\MalwareScanner;
use App\Enums\MalwareScanStatus;
use App\Enums\MalwareScanVerdict;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Exceptions\MalwareScannerException;
use App\Models\Share;
use Illuminate\Support\Facades\Storage;

final class ScanFileShareAction
{
    public function __construct(
        private MalwareScanner $scanner,
        private RemoveSharePayloadAction $removePayload,
    ) {}

    public function handle(int $shareId): void
    {
        $share = Share::query()->find($shareId);
        if ($share === null) {
            return;
        }

        if ($share->malware_scan_status === MalwareScanStatus::Detected && $share->hasPayload()) {
            $this->removePayload->handle($share);

            return;
        }

        if ($share->malware_scan_status !== MalwareScanStatus::Pending) {
            return;
        }

        if ($share->hasExpired()) {
            $this->skip($share, 'The File Share expired before scanning began.');

            return;
        }

        if ($share->kind !== ShareKind::File || $share->state !== ShareState::Ready || $share->storage_path === null) {
            $this->skip($share, 'The File Share no longer has an available payload.');

            return;
        }

        $stream = Storage::readStream($share->storage_path);
        if (! is_resource($stream)) {
            throw new MalwareScannerException('The File Share payload could not be opened for scanning.');
        }

        try {
            $result = $this->scanner->scan($stream);
        } finally {
            fclose($stream);
        }

        if ($result->verdict === MalwareScanVerdict::Clean) {
            $share->update([
                'malware_scan_status' => MalwareScanStatus::Clean,
                'malware_detected_name' => null,
                'malware_scan_error' => null,
                'malware_scanned_at' => now(),
            ]);

            return;
        }

        $share->update([
            'state' => ShareState::Blocked,
            'malware_scan_status' => MalwareScanStatus::Detected,
            'malware_detected_name' => $result->detectionName,
            'malware_scan_error' => null,
            'malware_scanned_at' => now(),
        ]);

        $this->removePayload->handle($share);
    }

    private function skip(Share $share, string $reason): void
    {
        $share->update([
            'malware_scan_status' => MalwareScanStatus::Skipped,
            'malware_scan_error' => $reason,
            'malware_scanned_at' => now(),
        ]);
    }
}
