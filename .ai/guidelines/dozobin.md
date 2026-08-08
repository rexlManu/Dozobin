# Dōzobin project guidelines

## Project overview

Dōzobin is a self-hosted workspace for unlisted File Shares, Pastes, and temporary accountless Transfer Sessions. It is a single Laravel application with an Inertia/React frontend, database-backed queues, and one deployment-controlled File Store.

- Backend: PHP 8.4.1+, Laravel 13, Eloquent, Pest 4, PHPStan/Larastan level 7, and Laravel Pint.
- Frontend: TypeScript, React 19, Inertia 3, Vite 8, Tailwind CSS 4, and Vitest.
- Local environment: DDEV with MariaDB, Node.js 24, and pnpm 10.
- Production: the repository Docker image or an equivalent PHP deployment, with MariaDB or another Laravel-supported database.

Read `CONTEXT.md` before naming or changing domain concepts. It defines terms such as File Share, Paste, Transfer Session, Member, Guest, Payload, and File Store. Record durable architecture decisions under `docs/adr/`.

## Initial setup

Run the project through DDEV:

```sh
ddev start
ddev exec composer setup
```

`composer setup` installs the locked PHP and frontend dependencies, creates `.env` when missing, generates `APP_KEY`, applies migrations, and builds the frontend. It is an initial bootstrap command, not a routine validation command.

Open the DDEV primary URL and complete the installation wizard when the database has no installed settings. DDEV already supervises Vite, the `default` and `scans` queue workers, and the Laravel scheduler. Do not start duplicate development servers, workers, or schedulers.

Run PHP, Composer, Artisan, and frontend commands inside DDEV. Use pnpm exclusively for JavaScript packages and one-off frontend tools; do not use npm, Yarn, or Bun.

## Development workflow

- Keep controllers thin. Put mutations and multi-step use cases in `app/Actions`, integration logic in `app/Services`, validation in Form Requests, and response serialization in API Resources.
- Prefer dependency injection over facades in application code when a project service already owns the concern.
- Use Eloquent relationships, casts, enums, policies, middleware, and route model binding consistently with the surrounding code.
- Add schema changes as forward migrations. Do not rewrite an existing migration that may already have run outside a disposable test database.
- Keep Inertia pages in `resources/js/pages`, reusable UI in `resources/js/components`, shared TypeScript types in `resources/js/types` or `resources/js/lib/types.ts`, and browser state outside page components only when it is genuinely shared.
- Preserve strict TypeScript types. Do not use `any` unless no accurate type can be expressed.
- Wayfinder output under `resources/js/actions`, `resources/js/routes`, and `resources/js/wayfinder` is generated and gitignored. Do not hand-edit or commit it.
- Do not run a development server or production build unless the task specifically requires it. The DDEV services are already running during normal agent work.

## File Store and release boundaries

All user-generated files—including File Share payloads, file Transfer Items, and Member avatars—must go through `App\Services\FileStore`. Do not introduce a second upload disk, Media Library, or direct `Storage` calls for these files.

- Local development defaults to `storage/app/private`.
- The Docker image uses `/data/files` on the persistent `/data` volume.
- S3-compatible deployments use the same `s3` disk and support AWS S3, MinIO, and Hetzner Object Storage.
- Buckets remain private. Use `FileResponseFactory` for authorized payload responses so S3 downloads receive short-lived signed URLs while local files stream through Laravel.
- Avatars remain in the private File Store and are served through the application route.
- File Store failures should degrade file operations with a service-unavailable response; `/ready` checks the database and File Store while `/up` remains the web-process liveness endpoint.

The application only reports updates; it never pulls images, mounts the Docker socket, restarts itself, or applies an upgrade. Stable builds read immutable metadata from `bootstrap/build.json`, and administrators see newer public GitHub Releases. Development builds use version `dev` and must not contact GitHub for update checks.

## Tests and validation

Run the same complete check as CI before handing off a substantial change:

```sh
ddev exec composer ci:check
```

That command checks ESLint, Prettier, TypeScript, Pint, PHPStan, and the Pest suite. Use narrower commands while iterating:

```sh
ddev exec php artisan test tests/Feature/ShareManagementTest.php
ddev exec php artisan test --filter="test name"
ddev exec pnpm run test:frontend
ddev exec vendor/bin/phpstan analyse
ddev exec vendor/bin/pint --test
ddev exec pnpm run lint:check
ddev exec pnpm run format:check
ddev exec pnpm run types:check
```

Add or update a Pest regression test for backend behavior. Frontend behavior belongs in colocated `*.test.ts` or `*.test.tsx` files where practical. Tests use factories and Laravel's database helpers; never depend on existing local data or live external services. Fake GitHub, mail, storage, queues, and other network or infrastructure boundaries.

## Security and data handling

- Preserve authorization checks before exposing Share payloads, Transfer Items, administration routes, or account data.
- Treat Share URLs as unlisted capabilities, not public listings. Protected Shares additionally require their password session.
- Keep buckets and local payload paths private. Never replace signed or application-mediated access with permanent public object URLs.
- Validate uploads against the installation limits and keep malware scanning on its dedicated `scans` queue.
- Never add secrets, `.env` files, uploaded payloads, built frontend assets, or generated Wayfinder files to version control.
- Preserve unrelated working-tree changes and avoid destructive database or Git commands.

## Build, deployment, and releases

Production behavior is defined by `Dockerfile`, `compose.production.yaml`, and `docs/operations/docker.md`. The container applies migrations before supervising Nginx, PHP-FPM, both queue workers, and the scheduler. ClamAV and the database remain separate services.

The workflow in `.github/workflows/release.yml` publishes only stable `vMAJOR.MINOR.PATCH` tags to GHCR for AMD64 and ARM64, then creates the matching GitHub Release. Do not publish an image or create a tag unless the user explicitly requests a release. Follow `RELEASE_CHECKLIST.md` and `docs/operations/releases.md` before publishing.

## Laravel Boost ownership

Laravel Boost generates the root `AGENTS.md`. Do not make durable project-specific edits directly in that generated file. Update files under `.ai/guidelines/`, then regenerate Boost's agent guidance with:

```sh
ddev exec php artisan boost:install
```
