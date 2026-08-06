<?php

namespace App\Actions\Shares;

use App\Models\Share;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class UnlockShareAction
{
    public function handle(Request $request, Share $share, string $password): void
    {
        if ($share->password === null || ! Hash::check($password, $share->password)) {
            throw ValidationException::withMessages(['password' => 'That password is not correct.']);
        }

        $request->session()->put("share_unlocked_{$share->slug}", true);
    }
}
