<?php

namespace App\Actions\Auth;

use App\Enums\RegistrationMode;
use App\Models\InstallationSetting;
use App\Models\User;
use App\Services\InviteCodeResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegisterUserAction
{
    public function __construct(private readonly InviteCodeResolver $invites) {}

    /** @param array{name: string, email: string, password: string, invite?: string|null} $data */
    public function handle(array $data): User
    {
        $settings = InstallationSetting::current();

        return DB::transaction(function () use ($data, $settings): User {
            $invite = null;

            if ($settings->registration === RegistrationMode::Invite) {
                $code = (string) ($data['invite'] ?? '');
                $invite = $this->invites->findAvailable($code, lockForUpdate: true);

                if ($invite === null && ! $this->invites->matchesLegacyCode($code)) {
                    throw ValidationException::withMessages(['invite' => 'That invite code is invalid, expired, or has no uses left.']);
                }
            }

            $user = User::query()->create([
                'invite_code_id' => $invite?->id,
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'password' => $data['password'],
                'storage_limit' => $settings->default_quota_mb * 1024 * 1024,
                'default_expiration' => $settings->member_default_expiration,
            ]);

            $invite?->increment('uses');

            return $user;
        });
    }
}
