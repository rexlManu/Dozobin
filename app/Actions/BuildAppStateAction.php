<?php

namespace App\Actions;

use App\Http\Resources\InstallationSettingResource;
use App\Http\Resources\ShareResource;
use App\Http\Resources\TransferSessionResource;
use App\Http\Resources\UserResource;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\TransferSession;
use App\Models\User;
use Illuminate\Http\Request;

final class BuildAppStateAction
{
    /** @return array<string, mixed> */
    public function handle(
        Request $request,
        ?Share $publicShare = null,
        ?TransferSession $transfer = null,
        bool $admin = false,
    ): array {
        $current = $request->user();
        $impersonatorId = $request->session()->get('impersonator_id');
        $accounts = collect();
        $shares = collect();

        if ($current !== null) {
            $accounts = $admin && $current->isAdmin()
                ? User::query()->with('apiTokens')->orderBy('name')->get()
                : collect([$current->load('apiTokens')]);
            $shares = $admin && $current->isAdmin()
                ? Share::query()->latest()->get()
                : $current->shares()->latest()->get();

            if (is_numeric($impersonatorId) && ! $accounts->contains('id', (int) $impersonatorId)) {
                $impersonator = User::query()->with('apiTokens')->find((int) $impersonatorId);
                if ($impersonator !== null) {
                    $accounts->push($impersonator);
                }
            }
        }

        if ($publicShare !== null && ! $shares->contains('id', $publicShare->id)) {
            $shares->push($publicShare);
        }

        $accountData = UserResource::collection($accounts)->resolve($request);
        $shareData = ShareResource::collection($shares)->resolve($request);
        $transfer?->loadMissing(['items.participant', 'participants', 'activities']);

        return [
            'accounts' => collect($accountData)->keyBy('id')->all(),
            'currentAccountId' => $current === null ? null : (string) $current->id,
            'shares' => array_values($shareData),
            'queue' => [],
            'transfer' => $transfer === null ? null : (new TransferSessionResource($transfer))->resolve($request),
            'transferHistory' => $admin && $current?->isAdmin()
                ? TransferSessionResource::collection(
                    TransferSession::query()->with(['items.participant', 'participants', 'activities'])->latest()->limit(100)->get(),
                )->resolve($request)
                : [],
            'adminConfig' => (new InstallationSettingResource(InstallationSetting::current()))->resolve($request),
            'adminDraft' => (new InstallationSettingResource(InstallationSetting::current()))->resolve($request),
            'appearance' => $current?->appearance->value ?? 'system',
            'uploadFault' => 'none',
            'unlocked' => $publicShare !== null && $request->session()->has("share_unlocked_{$publicShare->slug}")
                ? [$publicShare->slug]
                : [],
            'impersonating' => is_numeric($impersonatorId) ? (string) $impersonatorId : null,
        ];
    }
}
