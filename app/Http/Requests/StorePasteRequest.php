<?php

namespace App\Http\Requests;

use App\Data\CreatePasteData;
use App\Enums\Expiration;
use App\Enums\PasteType;
use App\Models\InstallationSetting;
use App\Models\Share;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StorePasteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Share::class)
            ?? InstallationSetting::current()->guest_sharing;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $settings = InstallationSetting::current();

        return [
            'body' => ['required', 'string', 'max:1000000'],
            'paste_type' => ['required', Rule::enum(PasteType::class)],
            'language' => ['nullable', 'string', 'max:64'],
            'expiration' => ['required', Rule::enum(Expiration::class), Rule::in($settings->expirationsFor($this->user()))],
            'password' => ['nullable', 'string', 'min:4', 'max:255'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $settings = InstallationSetting::current();
            if ($this->user() === null && $this->filled('password') && ! $settings->guest_password_protection) {
                $validator->errors()->add('password', 'Guests cannot protect shares on this installation.');
            }
        }];
    }

    public function toData(): CreatePasteData
    {
        return new CreatePasteData(
            body: $this->string('body')->toString(),
            pasteType: PasteType::from($this->string('paste_type')->toString()),
            language: $this->filled('language') ? $this->string('language')->toString() : null,
            expiration: Expiration::from($this->string('expiration')->toString()),
            password: $this->filled('password') ? $this->string('password')->toString() : null,
        );
    }
}
