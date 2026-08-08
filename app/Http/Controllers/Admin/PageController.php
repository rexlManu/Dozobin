<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Transfers\FindCurrentTransferSessionAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\ShareResource;
use App\Http\Resources\TransferSessionResource;
use App\Http\Resources\UserResource;
use App\Models\Share;
use App\Models\TransferSession;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

final class PageController extends Controller
{
    public function users(Request $request): Response
    {
        return Inertia::render('admin/users/index', [
            'accounts' => fn () => UserResource::collection(
                QueryBuilder::for(User::class)
                    ->allowedFilters(
                        AllowedFilter::partial('name'),
                        AllowedFilter::exact('role'),
                        AllowedFilter::exact('status'),
                    )
                    ->allowedSorts('name', 'email', 'created_at', 'storage_limit')
                    ->defaultSort('name')
                    ->with('apiTokens')
                    ->get(),
            )->resolve($request),
            'shares' => fn () => ShareResource::collection(Share::query()->latest()->get())->resolve($request),
        ]);
    }

    public function user(Request $request, User $user): Response
    {
        return Inertia::render('admin/users/show', [
            'account' => fn () => (new UserResource($user->load('apiTokens')))->resolve($request),
            'accounts' => fn () => UserResource::collection(User::query()->with('apiTokens')->orderBy('name')->get())->resolve($request),
            'shares' => fn () => ShareResource::collection($user->shares()->latest()->get())->resolve($request),
        ]);
    }

    public function uploads(Request $request): Response
    {
        return Inertia::render('admin/uploads/index', [
            'accounts' => fn () => UserResource::collection(User::query()->with('apiTokens')->orderBy('name')->get())->resolve($request),
            'shares' => fn () => ShareResource::collection(
                QueryBuilder::for(Share::class)
                    ->allowedFilters(
                        AllowedFilter::exact('kind'),
                        AllowedFilter::exact('state'),
                        AllowedFilter::exact('malware_scan_status'),
                        AllowedFilter::exact('user_id'),
                    )
                    ->allowedSorts('created_at', 'expires_at', 'size_bytes', 'views')
                    ->defaultSort('-created_at')
                    ->get(),
            )->resolve($request),
        ]);
    }

    public function userUploads(Request $request, User $user): Response
    {
        return Inertia::render('admin/users/uploads', [
            'account' => fn () => (new UserResource($user->load('apiTokens')))->resolve($request),
            'accounts' => fn () => UserResource::collection(User::query()->with('apiTokens')->orderBy('name')->get())->resolve($request),
            'shares' => fn () => ShareResource::collection($user->shares()->latest()->get())->resolve($request),
        ]);
    }

    public function transfers(Request $request, FindCurrentTransferSessionAction $current): Response
    {
        return Inertia::render('admin/transfers/index', [
            'transfer' => fn () => $this->transfer($request, $current->handle($request)),
            'transferHistory' => fn () => TransferSessionResource::collection(
                TransferSession::query()->with(['items.participant', 'participants', 'activities'])->latest()->limit(100)->get(),
            )->resolve($request),
        ]);
    }

    public function access(): Response
    {
        return Inertia::render('admin/settings/access');
    }

    public function expiration(): Response
    {
        return Inertia::render('admin/settings/expiration');
    }

    public function limits(): Response
    {
        return Inertia::render('admin/settings/limits');
    }

    public function fileTypes(): Response
    {
        return Inertia::render('admin/settings/file-types');
    }

    public function transferSettings(Request $request, FindCurrentTransferSessionAction $current): Response
    {
        return Inertia::render('admin/settings/transfer', [
            'transfer' => fn () => $this->transfer($request, $current->handle($request)),
        ]);
    }

    public function housekeeping(Request $request): Response
    {
        return Inertia::render('admin/settings/housekeeping', [
            'shares' => fn () => ShareResource::collection(Share::query()->latest()->get())->resolve($request),
        ]);
    }

    /** @return array<string, mixed>|null */
    private function transfer(Request $request, ?TransferSession $session): ?array
    {
        return $session === null ? null : (new TransferSessionResource($session))->resolve($request);
    }
}
