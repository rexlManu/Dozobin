<?php

namespace App\Http\Requests;

use App\Models\InstallationSetting;
use Illuminate\Foundation\Http\FormRequest;

final class CleanupExpiredSharePayloadsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', InstallationSetting::current()) ?? false;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }
}
