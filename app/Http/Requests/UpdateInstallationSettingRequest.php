<?php

namespace App\Http\Requests;

use App\Enums\Expiration;
use App\Enums\RegistrationMode;
use App\Models\InstallationSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateInstallationSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', InstallationSetting::current()) ?? false;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'guestSharing' => ['required', 'boolean'],
            'registration' => ['required', Rule::enum(RegistrationMode::class)],
            'guestExpirations' => ['required', 'array', 'min:1'],
            'guestExpirations.*' => ['required', Rule::enum(Expiration::class), 'distinct'],
            'memberExpirations' => ['required', 'array', 'min:1'],
            'memberExpirations.*' => ['required', Rule::enum(Expiration::class), 'distinct'],
            'guestDefaultExpiration' => ['required', Rule::enum(Expiration::class)],
            'memberDefaultExpiration' => ['required', Rule::enum(Expiration::class)],
            'guestPasswordProtection' => ['required', 'boolean'],
            'defaultQuotaMb' => ['required', 'integer', 'min:1', 'max:1048576'],
            'maxUploadMb' => ['required', 'integer', 'min:1', 'max:102400'],
            'fileTypeMode' => ['required', Rule::in(['allow', 'block'])],
            'fileTypeList' => ['required', 'array', 'max:100'],
            'fileTypeList.*' => ['required', 'string', 'regex:/^[a-z0-9]+$/', 'distinct'],
            'transferWindowHours' => ['required', 'integer', 'min:1', 'max:72'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! in_array($this->input('guestDefaultExpiration'), $this->input('guestExpirations', []), true)) {
                $validator->errors()->add('guestDefaultExpiration', 'The Guest default must be an allowed expiration.');
            }
            if (! in_array($this->input('memberDefaultExpiration'), $this->input('memberExpirations', []), true)) {
                $validator->errors()->add('memberDefaultExpiration', 'The Member default must be an allowed expiration.');
            }
        }];
    }
}
