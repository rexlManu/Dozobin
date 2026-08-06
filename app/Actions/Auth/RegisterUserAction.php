<?php

namespace App\Actions\Auth;

use App\Enums\RegistrationMode;
use App\Models\InstallationSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegisterUserAction
{
    /** @param array{name: string, email: string, password: string, invite?: string|null} $data */
    public function handle(array $data): User
    {
        $settings = InstallationSetting::current();

        if ($settings->registration === RegistrationMode::Invite) {
            $expected = config('dozobin.invite_code');
            if (! is_string($expected) || $expected === '' || ! hash_equals($expected, (string) ($data['invite'] ?? ''))) {
                throw ValidationException::withMessages(['invite' => 'That invite code is not valid.']);
            }
        }

        return DB::transaction(fn (): User => User::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'storage_limit' => $settings->default_quota_mb * 1024 * 1024,
            'default_expiration' => $settings->member_default_expiration,
        ]));
    }
}
