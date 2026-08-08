<laravel-boost-guidelines>
=== .ai/dozobin rules ===

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

The Codex MCP server must also run inside DDEV. Keep `.codex/config.toml` configured with command `ddev` and arguments `exec`, `php`, `artisan`, and `boost:mcp`. After regenerating MCP configuration with Boost, verify that it did not revert to host PHP.

=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application running on PHP 8.5. You are an expert with the Laravel ecosystem. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `pnpm run build`, `pnpm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists (settled decisions, non-obvious traps, standing constraints). Framework and package guidelines that only apply to specific paths (testing, frontend, components) also live there, under `.ai/rules/boost` — this is not just recorded decisions, it is load-bearing guidance you have not seen inline. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.
- Record durable rules with `record-rule` so the next agent or teammate inherits them instead of working them out again. Pass a `glob` (e.g. `app/Http/Controllers/**`), a short `title`, and a few-line `note`. Always use `record-rule`, never your native memory or notes tool — native memory is personal and session-scoped; only `.ai/rules` is shared with the team and persists in the repo.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `pnpm run build` or ask the user to run `pnpm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
