<?php

namespace App\Jobs;

use App\Actions\Shares\ScanFileShareAction;
use App\Enums\MalwareScanStatus;
use App\Models\Share;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

final class ScanFileShareJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    /** Initial attempt followed by three retries. */
    public int $tries = 4;

    public int $uniqueFor = 3600;

    public function __construct(public readonly int $shareId) {}

    public function uniqueId(): string
    {
        return (string) $this->shareId;
    }

    /** @return list<int> */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(ScanFileShareAction $scan): void
    {
        $scan->handle($this->shareId);
    }

    public function failed(?Throwable $exception): void
    {
        Share::query()
            ->whereKey($this->shareId)
            ->where('malware_scan_status', MalwareScanStatus::Pending)
            ->update([
                'malware_scan_status' => MalwareScanStatus::Failed,
                'malware_scan_error' => Str::limit($exception?->getMessage() ?? 'The scanner failed.', 1000),
                'malware_scanned_at' => now(),
            ]);
    }
}
