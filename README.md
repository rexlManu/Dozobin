# Dōzobin

Dōzobin is a self-hosted workspace for sharing files, screenshots, and text. Regular Shares get unlisted URLs; Transfer Sessions move files and text between devices, then delete themselves after inactivity.

The app runs on Laravel 13, Inertia 3, React 19, and MariaDB or another Laravel-supported database.

## Screenshots

![Dōzobin Drop Workspace](docs/images/dozobin-drop.webp)

_The Drop Workspace: drop files or paste text, pick an expiry, get a link._

![A live Transfer Session](docs/images/dozobin-transfer.webp)

_A live Transfer Session: devices on the left, items on the right, updates on every device at once._

| | |
| --- | --- |
| ![Member Library](docs/images/dozobin-library.webp) | ![A File Share](docs/images/dozobin-share.webp) |
| _A Member's Library_ | _What a recipient sees_ |
| ![Takedown reports](docs/images/dozobin-reports.webp) | ![Installation settings](docs/images/dozobin-settings.webp) |
| _Takedown reports for the administrator_ | _Installation settings_ |

## What it does

- File Shares and Pastes with expiration, optional password protection, and Member Libraries
- Accountless Transfer Sessions joined by QR code or an eight-character Access Code, with live updates and presence through Laravel Reverb
- Configurable Guest access, registration, file rules, storage quotas, and cleanup windows
- Separate malware-scanning queue with ClamAV support
- Terms of Service and Privacy Policy pages, and a public form for takedown requests
- Administration screens for Members, invites, uploads, sessions, takedown reports, and installation settings

## Requirements

- PHP 8.5 or newer with the extensions checked by the installer
- Composer 2
- Node.js 24 and pnpm 10
- MariaDB 11, MySQL 8, PostgreSQL, or SQLite
- A queue worker and the Laravel scheduler

## Local setup with DDEV

```sh
ddev start
ddev exec composer setup
```

Open the DDEV URL and follow the installer. DDEV already runs Vite, both queue workers, and the scheduler.

For demo data, run `php artisan migrate:fresh --seed`. It replaces the database with "Studio Hinoki", a small studio with five accounts, shares in every state, invites, API tokens, Transfer Sessions, and takedown reports. Every account uses the password `password`; sign in as `admin@dozobin.test` or `member@dozobin.test`.

## Docker production install

The supported container runs Nginx, PHP-FPM, both queue workers, the scheduler, and Laravel Reverb for live Transfer Sessions. It applies database migrations before those processes start. Copy `compose.production.yaml`, provide `APP_KEY`, `APP_URL`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD`, then start it with Docker Compose or import the service into Coolify.

```sh
docker compose -f compose.production.yaml up -d
```

Reverb is reached on the same origin under `/app`, so your reverse proxy only has to pass WebSocket upgrades. Its keys are derived from `APP_KEY`.

Uploads use the persistent `app-data` volume at `/data/files` by default. Set `FILESYSTEM_DISK=s3` and the S3 variables to use AWS S3, MinIO, or Hetzner Object Storage instead. See [Docker deployment](docs/operations/docker.md) for the complete configuration and upgrade procedure.

Published images are anonymously pullable from `ghcr.io/rexlmanu/dozobin`. Pin an immutable version such as `0.1.0-alpha.2` instead of relying on a moving tag. The release and package-visibility flow is documented in [publishing releases](docs/operations/releases.md).

## Manual production install

Point the web server at `public/`; never serve the repository root. Then install the locked dependencies and compile the frontend:

```sh
composer install --no-dev --classmap-authoritative
pnpm install --frozen-lockfile
pnpm run build
php artisan key:generate
php artisan migrate --force
php artisan optimize
```

Set `APP_ENV=production`, `APP_DEBUG=false`, the public HTTPS `APP_URL`, database credentials, a working mail transport, and `SESSION_SECURE_COOKIE=true`. Keep `storage/` and `bootstrap/cache/` writable by the PHP process.

Two queue workers keep scanning from blocking cleanup jobs:

```sh
php artisan queue:work --queue=default --sleep=1 --tries=3 --timeout=300
php artisan queue:work --queue=scans --sleep=1 --tries=4 --timeout=300
```

Run `php artisan schedule:run` once per minute, or supervise `php artisan schedule:work`. Restart both workers after every deployment with `php artisan queue:restart`.

For live Transfer Sessions, supervise `php artisan reverb:start` and set the same variables the Docker image uses: `BROADCAST_CONNECTION=reverb`, `REVERB_HOST=127.0.0.1`, `REVERB_PORT=6001`, `REVERB_SCHEME=http`, `REVERB_SERVER_HOST=127.0.0.1`, and `REVERB_SERVER_PORT=6001`. Then proxy `/app` and `/apps` to `127.0.0.1:6001` with WebSocket upgrades, as [docker/nginx.conf](docker/nginx.conf) does. Without Reverb, devices check for changes every 10 seconds.

The first request opens a three-step installer unless `DOZOBIN_SKIP_INSTALLER=true`. Read [first-run installation](docs/operations/first-run-installation.md), [Docker deployment](docs/operations/docker.md), and [maintenance and malware scanning](docs/operations/maintenance-and-malware-scanning.md) before exposing the host.

## Search indexing

Production installations allow indexing by default. Only the Drop Workspace appears in `sitemap.xml`; auth pages, administration, Transfer Sessions, and unlisted Share URLs return `noindex` headers and metadata.

Set `SEO_INDEX=false` for a private installation. `robots.txt` then blocks the whole host and `sitemap.xml` stays empty. Set `SEO_DESCRIPTION` to describe your instance and `SEO_IMAGE_URL` to an absolute 1200 by 630 social-card URL.

## Before opening the server

Work through [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). It covers HTTPS, workers, backups, mail, storage limits, abuse controls, and search-engine submission.

## Development checks

```sh
composer ci:check
```

That command runs PHP formatting, PHPStan, Pest, ESLint, Prettier, and TypeScript checks. See [CONTRIBUTING.md](CONTRIBUTING.md) before sending a pull request.

## Security and license

Report a vulnerability through the process in [SECURITY.md](SECURITY.md). Dōzobin is available under the [MIT License](LICENSE).
