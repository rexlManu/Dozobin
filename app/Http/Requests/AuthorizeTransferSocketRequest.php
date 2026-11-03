<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Pusher-protocol channel authorization sent by Echo for a Transfer Session presence channel. */
final class AuthorizeTransferSocketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'socket_id' => ['required', 'string', 'regex:/^\d+\.\d+$/'],
            'channel_name' => ['required', 'string', 'regex:/^presence-transfer\.[A-Z0-9]{8}$/'],
        ];
    }

    public function accessCode(): string
    {
        return substr($this->string('channel_name')->toString(), strlen('presence-transfer.'));
    }
}
