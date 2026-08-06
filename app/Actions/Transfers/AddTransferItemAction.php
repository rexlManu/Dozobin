<?php

namespace App\Actions\Transfers;

use App\Enums\TransferItemKind;
use App\Models\TransferItem;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class AddTransferItemAction
{
    public function __construct(private TouchTransferSessionAction $touch) {}

    public function handle(
        TransferSession $session,
        TransferParticipant $participant,
        ?UploadedFile $file,
        ?string $body,
    ): TransferItem {
        $path = null;
        try {
            if ($file !== null) {
                $path = $file->storeAs(
                    "transfers/{$session->access_code}",
                    Str::random(16).'.'.$file->getClientOriginalExtension(),
                );
                if (! is_string($path)) {
                    throw new RuntimeException('The transfer item could not be stored.');
                }
            }

            return DB::transaction(function () use ($session, $participant, $file, $body, $path): TransferItem {
                $item = $session->items()->create([
                    'transfer_participant_id' => $participant->id,
                    'kind' => $file === null
                        ? TransferItemKind::Text
                        : (str_starts_with((string) $file->getMimeType(), 'image/') ? TransferItemKind::Image : TransferItemKind::File),
                    'name' => $file?->getClientOriginalName() ?? 'Text from '.$participant->label,
                    'mime_type' => $file?->getMimeType() ?? 'text/plain',
                    'size_bytes' => $file?->getSize() ?? strlen((string) $body),
                    'storage_path' => $path,
                    'body' => $body,
                ]);
                $this->touch->handle($session, $participant, 'added '.$item->name);

                return $item->load('participant');
            });
        } catch (Throwable $exception) {
            if (is_string($path)) {
                Storage::delete($path);
            }
            throw $exception;
        }
    }
}
