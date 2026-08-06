<?php

namespace App\Http\Requests;

use App\Enums\RegistrationMode;
use App\Models\InstallationSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return InstallationSetting::current()->registration !== RegistrationMode::Closed;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $inviteRequired = InstallationSetting::current()->registration === RegistrationMode::Invite;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'invite' => [$inviteRequired ? 'required' : 'nullable', 'string', 'max:255'],
        ];
    }
}
