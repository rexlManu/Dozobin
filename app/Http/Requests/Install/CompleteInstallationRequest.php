<?php

namespace App\Http\Requests\Install;

use App\Http\Requests\UpdateInstallationSettingRequest;

/**
 * The same settings the administration area edits, asked for once up front.
 * Authorization differs: the wizard's own middleware already established that
 * the installation is unfinished, and the account step signed the first
 * administrator in.
 */
final class CompleteInstallationRequest extends UpdateInstallationSettingRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }
}
