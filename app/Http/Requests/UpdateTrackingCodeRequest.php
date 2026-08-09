<?php

namespace App\Http\Requests;

use App\Models\InstallationSetting;
use App\Rules\ExternalTrackingScript;
use App\Services\TrackingScriptParser;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateTrackingCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', InstallationSetting::current()) ?? false;
    }

    /** @return array<string, list<mixed>> */
    public function rules(TrackingScriptParser $parser): array
    {
        return [
            'trackingCode' => ['nullable', 'string', 'max:10000', new ExternalTrackingScript($parser)],
        ];
    }
}
