<?php

namespace App\Actions\Installation;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\InstallationSetting;
use App\Models\User;
use App\Services\InstallationState;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CreateFirstAdministratorAction
{
    public function __construct(private InstallationState $state) {}

    /** @param array{name: string, email: string, password: string} $data */
    public function handle(array $data): User
    {
        // The one endpoint on a fresh installation that anyone can reach. It
        // closes the moment an administrator exists.
        if ($this->state->hasAdministrator()) {
            throw ValidationException::withMessages([
                'email' => 'This installation already has an administrator.',
            ]);
        }

        $settings = InstallationSetting::current();

        $user = DB::transaction(fn (): User => User::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => UserRole::Admin,
            'status' => UserStatus::Active,
            'storage_limit' => $settings->default_quota_mb * 1024 * 1024,
            'default_expiration' => $settings->member_default_expiration,
        ]));

        $this->state->refresh();

        return $user;
    }
}
