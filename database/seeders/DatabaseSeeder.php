<?php

namespace Database\Seeders;

use App\Enums\Expiration;
use App\Enums\MalwareScanStatus;
use App\Enums\PasteType;
use App\Enums\RegistrationMode;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Enums\TakedownReason;
use App\Enums\TakedownStatus;
use App\Enums\TransferItemKind;
use App\Enums\UserStatus;
use App\Models\ApiToken;
use App\Models\InstallationSetting;
use App\Models\InviteCode;
use App\Models\Share;
use App\Models\TakedownRequest;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use App\Models\User;
use App\Services\FileStore;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Demo data for local work: "Studio Hinoki", a small design studio that runs
 * Dōzobin for itself and its clients.
 *
 * - Ruben (admin) runs the server. Ines (designer) and Kenji (developer) use
 *   it every day. Noah is a freelancer who joined with an invite and is close
 *   to his storage limit. Mara was suspended for spam.
 * - Shares cover every kind and state: images, a PDF, audio, archives, code
 *   and Markdown Pastes, Protected Shares, and expired, blocked, unscanned and
 *   unavailable ones, plus a few Guest uploads.
 * - Invites, API tokens, two Transfer Sessions and four takedown reports.
 *
 * Every account uses the password "password". Protected Shares use "hinoki".
 * Files go through the File Store.
 */
final class DatabaseSeeder extends Seeder
{
    private FileStore $files;

    public function run(FileStore $files): void
    {
        $this->files = $files;

        InstallationSetting::factory()->create([
            'registration' => RegistrationMode::Invite,
            'guest_sharing' => true,
        ]);

        $ruben = $this->user('Ruben Ishikawa', 'admin@dozobin.test', joined: 60, admin: true, avatar: 3);
        $ines = $this->user('Ines Mori', 'member@dozobin.test', joined: 48, avatar: 11);
        $kenji = $this->user('Kenji Arai', 'kenji@dozobin.test', joined: 41, avatar: 27);
        $freelancers = $this->invites($ruben);
        $noah = $this->user('Noah Becker', 'noah@dozobin.test', joined: 9, limitMb: 20, invite: $freelancers);
        $mara = $this->user('Mara Lindqvist', 'mara@dozobin.test', joined: 21);
        $mara->update(['status' => UserStatus::Suspended, 'suspended_at' => now()->subDays(3)]);

        $this->rubenShares($ruben);
        $this->inesShares($ines);
        $kenjiPaste = $this->kenjiShares($kenji);
        $this->noahShares($noah);
        $maraPaste = $this->maraShares($mara);
        $guestPhoto = $this->guestShares();

        $this->tokens($kenji, $ines);
        $this->transferSessions();
        $this->reports($ruben, $guestPhoto, $maraPaste, $kenjiPaste);
    }

    private function user(string $name, string $email, int $joined, bool $admin = false, ?int $avatar = null, int $limitMb = 5120, ?InviteCode $invite = null): User
    {
        $factory = User::factory();
        $user = ($admin ? $factory->admin() : $factory)->create([
            'name' => $name,
            'email' => $email,
            'password' => 'password',
            'storage_limit' => $limitMb * 1024 * 1024,
            'default_expiration' => Expiration::SevenDays,
            'invite_code_id' => $invite?->id,
        ]);
        $user->forceFill(['created_at' => now()->subDays($joined)])->save();

        if ($avatar !== null) {
            $path = 'avatars/demo-'.Str::slug($name).'.jpg';
            $this->files->put($path, DemoFiles::photo(256, 256, $avatar));
            $user->forceFill(['avatar_path' => $path])->save();
        }

        return $user;
    }

    private function invites(User $admin): InviteCode
    {
        $make = fn (string $name, string $code, array $state): InviteCode => InviteCode::query()->create([
            'created_by_user_id' => $admin->id,
            'name' => $name,
            'code' => $code,
            'code_hash' => InviteCode::hashCode($code),
            ...$state,
        ]);

        $make('Agency partners', 'DOZO-PART-NERS-2026', ['expires_at' => now()->subDays(5)]);
        $make('Summer intern', 'DOZO-INTE-RNSU-MMER', ['max_uses' => 1, 'uses' => 1]);
        $make('Old onboarding link', 'DOZO-OLDL-INKX-7Q2M', ['revoked_at' => now()->subDays(12)]);

        return $make('Freelancers', 'DOZO-FREE-LANC-ERS9', ['max_uses' => 10, 'uses' => 3, 'expires_at' => now()->addDays(30)]);
    }

    private function rubenShares(User $ruben): void
    {
        $this->paste($ruben, 'rubennginxconf8k2m4q', <<<'NGINX'
            server {
                listen 443 ssl http2;
                server_name share.studio-hinoki.example;

                client_max_body_size 512m;

                location / {
                    proxy_pass http://127.0.0.1:8080;
                    proxy_set_header Host $host;
                    proxy_set_header X-Forwarded-Proto https;
                }
            }
            NGINX, PasteType::Code, 'bash', days: 12, views: 4, expires: now()->addDays(18));

        $this->paste($ruben, 'rubenwifiguest3n7p1x', "Guest Wi-Fi: Hinoki-Guest\nPassword: matcha-at-four\n\nThe printer is \"Studio Brother\" on the same network.", PasteType::Text, days: 2, views: 9, expires: now()->addDays(5), password: true);

        $this->file($ruben, 'rubenbackuplog9q4w2e', 'backup-2026-11-03.zip', 'application/zip', DemoFiles::zip([
            'backup/manifest.json' => (string) json_encode(['tables' => 14, 'files' => 238], JSON_PRETTY_PRINT),
            'backup/database.sql' => "-- Studio Hinoki nightly dump\n".str_repeat("INSERT INTO shares VALUES (...);\n", 400),
        ]), days: 1, views: 1, expires: now()->addDays(6));
    }

    private function inesShares(User $ines): void
    {
        $this->file($ines, 'morningwindow7k2q9x', 'homepage-hero-v3.png', 'image/png', DemoFiles::mockup(1440, 900, [255, 143, 171]), days: 0, views: 23, expires: now()->addDays(7));
        $this->file($ines, 'inesonboarding5t8r2y', 'onboarding-flow.png', 'image/png', DemoFiles::mockup(1280, 800, [185, 168, 255]), days: 3, views: 14, expires: now()->addDays(4));
        $this->file($ines, 'inesmoodboard4h6j8k', 'moodboard-dusk.jpg', 'image/jpeg', DemoFiles::photo(1600, 1000, 7), days: 5, views: 31, expires: now()->addDays(25));
        $this->file($ines, 'inesbriefpdf2x9c4v', 'client-brief-hanami-tea.pdf', 'application/pdf', DemoFiles::pdf('Hanami Tea: website brief', [
            'Client: Hanami Tea House, Kyoto',
            'Goal: a calm online shop for loose leaf tea.',
            '',
            'Pages: home, shop, product, story, contact.',
            'Tone: warm, slow, a little playful.',
            'Colours: matcha green, rice paper, a deep plum accent.',
            '',
            'Timeline: concepts by 14 November, launch in January.',
        ]), days: 6, views: 6, expires: now()->addDays(24));
        $this->file($ines, 'inesvoicememo6b3n1m', 'voice-note-feedback.wav', 'audio/wav', DemoFiles::wav(4, [392.0, 440.0, 523.25, 440.0]), days: 1, views: 2, expires: now()->addDays(6));

        $this->paste($ines, 'protectedbrief8m4p2', <<<'MD'
            # Feedback round 2: Hanami Tea

            Thanks for the notes! Here is what changes in **v3**:

            - The hero photo is warmer, and the cup sits on the left.
            - "Shop the harvest" is now the main button.
            - The product grid shows 3 columns on desktop, 2 on a phone.

            Open questions:

            1. Do we keep the seasonal banner after spring?
            2. Can you send the final logo as SVG?
            MD, PasteType::Markdown, days: 2, views: 8, expires: now()->addDay(), password: true);

        $this->paste($ines, 'inescolortokens7v5b3', <<<'CSS'
            :root {
                --matcha: #7fa36b;
                --rice-paper: #f6f1e7;
                --plum: #5b2a4a;
                --ink: #23201c;
                --radius-card: 18px;
            }
            CSS, PasteType::Code, 'css', days: 4, views: 12, expires: now()->addDays(3));

        // Expired a day ago; cleanup already removed the payload.
        $this->share($ines, 'inesoldconcept1z8x7c', [
            'kind' => ShareKind::File, 'filename' => 'concept-a-rejected.png', 'mime_type' => 'image/png',
            'size_bytes' => 1_284_112, 'views' => 17, 'expires_at' => now()->subDay(), 'payload_deleted_at' => now()->subHours(2),
        ], days: 8);
    }

    private function kenjiShares(User $kenji): Share
    {
        $this->paste($kenji, 'typescriptsample4n8', <<<'TS'
            type Share = { id: string; expiresAt: number | null };

            /** True while the share can still be opened. */
            export const isLive = (share: Share, now = Date.now()) =>
                share.expiresAt === null || share.expiresAt > now;

            export function sortByExpiry(shares: Share[]): Share[] {
                return [...shares].sort(
                    (a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity),
                );
            }
            TS, PasteType::Code, 'typescript', days: 3, views: 41, expires: now()->addDays(30));

        $this->paste($kenji, 'kenjimigration3c6v9b', <<<'SQL'
            ALTER TABLE orders ADD COLUMN gift_note text NULL;

            UPDATE orders
            SET gift_note = 'Happy birthday!'
            WHERE id IN (1042, 1057);

            CREATE INDEX orders_created_at_index ON orders (created_at);
            SQL, PasteType::Code, 'sql', days: 1, views: 3, expires: now()->addHours(20));

        $buildLog = $this->paste($kenji, 'kenjistacktrace2m5n8', <<<'LOG'
            $ pnpm run build
            > hanami-shop@0.4.0 build
            > vite build

            vite v8.0.2 building for production...
            ✓ 412 modules transformed.
            error during build:
            [vite]: Rollup failed to resolve import "@/lib/cart" from "src/pages/product.tsx".
            LOG, PasteType::Code, 'bash', days: 0, views: 5, expires: now()->addHours(6));

        $this->file($kenji, 'kenjiorderscsv8d2f5g', 'orders-october.csv', 'text/csv', DemoFiles::csv([
            ['order', 'date', 'items', 'total_eur', 'country'],
            ...array_map(fn (int $index): array => [
                1000 + $index,
                now()->subDays(40 - $index)->toDateString(),
                $index % 4 + 1,
                round(18.5 + $index * 3.25, 2),
                ['JP', 'DE', 'FR', 'NL', 'SE'][$index % 5],
            ], range(1, 30)),
        ]), days: 2, views: 7, expires: now()->addDays(12));

        $this->file($kenji, 'kenjibuildzip6h9j2k', 'hanami-shop-build-0.4.0.zip', 'application/zip', DemoFiles::zip([
            'dist/index.html' => '<!doctype html><title>Hanami Tea</title><div id="app"></div>',
            'dist/assets/app.js' => str_repeat('console.log("hanami");', 2000),
            'dist/assets/app.css' => str_repeat('.cup{color:#7fa36b}', 800),
        ]), days: 1, views: 2, expires: now()->addDays(2));

        // The scanner found something; the payload is gone but the Share URL stays.
        $this->share($kenji, 'kenjiinvoicedoc4p7q1', [
            'kind' => ShareKind::File, 'state' => ShareState::Blocked, 'filename' => 'invoice-template.docm',
            'mime_type' => 'application/vnd.ms-word.document.macroEnabled.12', 'size_bytes' => 88_412,
            'malware_scan_status' => MalwareScanStatus::Detected, 'malware_detected_name' => 'Doc.Dropper.Agent-1234',
            'malware_scanned_at' => now()->subDays(4), 'payload_deleted_at' => now()->subDays(4), 'views' => 0,
            'expires_at' => now()->addDays(3),
        ], days: 4);

        // The scanner was down: still public, flagged for the administrator.
        $this->file($kenji, 'kenjidesignkit5r3t8', 'icons-export.zip', 'application/zip', DemoFiles::zip([
            'icons/cup.svg' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/></svg>',
            'icons/leaf.svg' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 19C5 9 11 5 19 5c0 8-4 14-14 14z"/></svg>',
        ]), days: 2, views: 4, expires: now()->addDays(5), extra: [
            'malware_scan_status' => MalwareScanStatus::Failed,
            'malware_scan_error' => 'Scanner unavailable: connection refused.',
            'malware_scanned_at' => now()->subDays(2),
        ]);

        // The file went missing from storage.
        $this->share($kenji, 'missingarchive2p7k9', [
            'kind' => ShareKind::File, 'state' => ShareState::Unavailable, 'filename' => 'project-archive.zip',
            'mime_type' => 'application/zip', 'size_bytes' => 12_440_118, 'views' => 3, 'expires_at' => now()->addHours(5),
        ], days: 6);

        return $buildLog;
    }

    private function noahShares(User $noah): void
    {
        // Close to his 20 MB limit, so the meter fills up.
        $this->file($noah, 'noahrawphotos7m2n4b', 'shoot-raw-selects.zip', 'application/zip', DemoFiles::noise(9_400_000, 5), days: 4, views: 2, expires: now()->addDays(3));
        $this->file($noah, 'noahvideoproxy3k8l1', 'teaser-music-draft.wav', 'audio/wav', DemoFiles::wav(150, [261.63, 329.63, 392.0, 329.63]), days: 2, views: 5, expires: now()->addDays(5));
        $this->file($noah, 'noahcontactsheet9f4g', 'contact-sheet.jpg', 'image/jpeg', DemoFiles::photo(1800, 1200, 42), days: 1, views: 8, expires: now()->addDays(6));
    }

    private function maraShares(User $mara): Share
    {
        $this->paste($mara, 'maracryptopromo6x1c8', "MAKE 500% IN 3 DAYS\nJoin the group now: t.me/not-a-real-link\nLimited spots!!!", PasteType::Text, days: 4, views: 212, expires: now()->addDays(3));

        return $this->paste($mara, 'maraleakedlist4v7b2', "Customer list (do not share)\n\nA. Tanaka, +81 90 0000 1111, 2-3-4 Gion, Kyoto\nB. Weber, +49 151 0000 2222, Lindenstrasse 5, Berlin\n...", PasteType::Text, days: 3, views: 57, expires: now()->addDays(4));
    }

    private function guestShares(): Share
    {
        $photo = $this->file(null, 'guestsunsetphoto2w5e', 'IMG_4821.jpg', 'image/jpeg', DemoFiles::photo(1600, 1067, 99), days: 1, views: 64, expires: now()->addHours(18));
        $this->paste(null, 'guestrecipe8t3y6u1i', "Onigiri for 4\n\n- 2 cups short grain rice\n- 1 sheet nori, cut in strips\n- salt, umeboshi, a little salmon\n\nWet your hands, salt them, shape gently.", PasteType::Text, days: 0, views: 3, expires: now()->addDay());
        $this->file(null, 'guestwhiteboard5o9p2', 'whiteboard.png', 'image/png', DemoFiles::whiteboard(1280, 960), days: 0, views: 1, expires: now()->addHours(3));

        return $photo;
    }

    private function tokens(User $kenji, User $ines): void
    {
        $token = fn (User $user, string $name, array $state): ApiToken => ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'token_hash' => hash('sha256', Str::random(40)),
            'token_preview' => 'dozo_'.Str::lower(Str::random(5)).'…',
            ...$state,
        ]);

        $token($kenji, 'ShareX on the desktop', ['last_used_at' => now()->subHours(2)]);
        $token($kenji, 'CI build uploads', ['last_used_at' => now()->subDays(9), 'revoked_at' => now()->subDays(8)]);
        $token($ines, 'Screenshot shortcut', ['last_used_at' => now()->subMinutes(25)]);
    }

    private function transferSessions(): void
    {
        $live = TransferSession::factory()->create([
            'access_code' => 'K7MQ2XPD',
            'last_activity_at' => now()->subMinutes(2),
            'expires_at' => now()->addHours(12)->subMinutes(2),
        ]);
        $laptop = $this->participant($live, 1, 'Ines’s laptop', 'Desktop', 18);
        $phone = $this->participant($live, 2, 'Ines’s phone', 'Phone', 16);
        $tablet = $this->participant($live, 3, 'Studio iPad', 'Tablet', 12, leftMinutes: 5);

        $this->transferItem($live, $phone, TransferItemKind::Text, 'Text from Ines’s phone', minutes: 15, body: 'The Wi-Fi password is on the back of the router.');
        $this->transferItem($live, $phone, TransferItemKind::Image, 'whiteboard-session.png', minutes: 11, contents: DemoFiles::whiteboard(1080, 810), mime: 'image/png');
        $this->transferItem($live, $tablet, TransferItemKind::File, 'hanami-brief.pdf', minutes: 9, contents: DemoFiles::pdf('Hanami Tea: brief', ['Bring this to the client call.']), mime: 'application/pdf');
        $this->transferItem($live, $laptop, TransferItemKind::Text, 'Text from Ines’s laptop', minutes: 3, body: 'https://www.figma.com/file/hanami-tea-v3');

        foreach ([
            [$laptop, 'started the session', 18],
            [$phone, 'joined from a phone', 16],
            [$phone, 'added text', 15],
            [$phone, 'added whiteboard-session.png', 11],
            [$tablet, 'added hanami-brief.pdf', 9],
            [$tablet, 'left the session', 5],
            [$laptop, 'added text', 3],
        ] as [$participant, $description, $minutes]) {
            $live->activities()->create([
                'transfer_participant_id' => $participant->id,
                'actor' => $participant->label,
                'description' => $description,
            ])->forceFill(['created_at' => now()->subMinutes($minutes)])->save();
        }

        // Quiet for eleven hours; it ends within the hour.
        $quiet = TransferSession::factory()->create([
            'access_code' => 'R4ND9WQZ',
            'last_activity_at' => now()->subHours(11),
            'expires_at' => now()->addMinutes(55),
        ]);
        $kenjiLaptop = $this->participant($quiet, 4, 'Kenji’s laptop', 'Desktop', 660);
        $this->transferItem($quiet, $kenjiLaptop, TransferItemKind::Text, 'Text from Kenji’s laptop', minutes: 660, body: 'ssh deploy@hanami-staging -p 2222');
    }

    private function reports(User $admin, Share $guestPhoto, Share $maraPaste, Share $buildLog): void
    {
        TakedownRequest::factory()->forShare($guestPhoto)->create([
            'reason' => TakedownReason::Copyright,
            'details' => "This is my photo of Lake Biwa. I posted it on my portfolio in 2024 and never gave permission to share it here.\n\nOriginal: https://portfolio.example/biwa-sunset",
            'reporter_name' => 'Aiko Tanaka',
            'reporter_email' => 'aiko@photo.example',
        ]);

        $this->backdate(TakedownRequest::factory()->forShare($maraPaste)->create([
            'reason' => TakedownReason::Privacy,
            'details' => 'This paste lists my name, phone number and home address. I never agreed to that.',
            'reporter_name' => null,
            'reporter_email' => 'b.weber@mail.example',
        ]), now()->subHours(5));

        $this->backdate(TakedownRequest::factory()->handled(TakedownStatus::Resolved, $admin)->create([
            'share_url' => url('/s/fakeinvoice9z8y7x6w'),
            'reason' => TakedownReason::Malware,
            'details' => 'The "invoice" behind this link asks you to enable macros. It is a phishing attempt aimed at our accounting team.',
            'reporter_name' => 'IT security, Kamo Logistics',
            'reporter_email' => 'security@kamo.example',
            'handled_at' => now()->subDays(2),
        ]), now()->subDays(2)->subHours(3));

        $this->backdate(TakedownRequest::factory()->forShare($buildLog)->handled(TakedownStatus::Dismissed, $admin)->create([
            'reason' => TakedownReason::Other,
            'details' => 'I do not like this code.',
            'reporter_name' => null,
            'reporter_email' => 'someone@mail.example',
            'handled_at' => now()->subHours(20),
        ]), now()->subDay());
    }

    /** @param  array<string, mixed>  $extra */
    private function file(?User $owner, string $slug, string $filename, string $mime, string $contents, int $days, int $views, CarbonInterface $expires, array $extra = []): Share
    {
        $path = "shares/{$slug}/".Str::random(16).'.'.pathinfo($filename, PATHINFO_EXTENSION);
        $this->files->put($path, $contents);

        return $this->share($owner, $slug, [
            'kind' => ShareKind::File,
            'filename' => $filename,
            'mime_type' => $mime,
            'size_bytes' => strlen($contents),
            'storage_path' => $path,
            'views' => $views,
            'expires_at' => $expires,
            'malware_scan_status' => MalwareScanStatus::Skipped,
            ...$extra,
        ], $days);
    }

    private function paste(?User $owner, string $slug, string $body, PasteType $type, ?string $language = null, int $days = 0, int $views = 0, ?CarbonInterface $expires = null, bool $password = false): Share
    {
        return $this->share($owner, $slug, [
            'kind' => ShareKind::Paste,
            'body' => $body,
            'paste_type' => $type,
            'language' => $language,
            'mime_type' => $type === PasteType::Markdown ? 'text/markdown' : 'text/plain',
            'size_bytes' => strlen($body),
            'views' => $views,
            'expires_at' => $expires,
            'password' => $password ? Hash::make('hinoki') : null,
        ], $days);
    }

    /** @param  array<string, mixed>  $attributes */
    private function share(?User $owner, string $slug, array $attributes, int $days): Share
    {
        $created = now()->subDays($days)->subMinutes(crc32($slug) % 600);

        return Share::unguarded(fn (): Share => Share::query()->create([
            'slug' => $slug,
            'user_id' => $owner?->id,
            'state' => ShareState::Ready,
            'created_at' => $created,
            'updated_at' => $created,
            ...$attributes,
        ]));
    }

    private function participant(TransferSession $session, int $number, string $label, string $device, int $joinedMinutes, ?int $leftMinutes = null): TransferParticipant
    {
        return $session->participants()->create([
            'browser_id' => sprintf('00000000-0000-4000-8000-%012d', $number),
            'label' => $label,
            'device' => $device,
            'joined_at' => now()->subMinutes($joinedMinutes),
            'left_at' => $leftMinutes === null ? null : now()->subMinutes($leftMinutes),
        ]);
    }

    private function transferItem(TransferSession $session, TransferParticipant $participant, TransferItemKind $kind, string $name, int $minutes, ?string $contents = null, string $mime = 'text/plain', ?string $body = null): void
    {
        $path = null;

        if ($contents !== null) {
            $path = "transfers/{$session->access_code}/".Str::random(16).'.'.pathinfo($name, PATHINFO_EXTENSION);
            $this->files->put($path, $contents);
        }

        $this->backdate($session->items()->create([
            'transfer_participant_id' => $participant->id,
            'kind' => $kind,
            'name' => $name,
            'mime_type' => $mime,
            'size_bytes' => strlen($contents ?? (string) $body),
            'storage_path' => $path,
            'body' => $body,
        ]), now()->subMinutes($minutes));
    }

    private function backdate(Model $model, CarbonInterface $at): void
    {
        $model->forceFill(['created_at' => $at])->save();
    }
}
