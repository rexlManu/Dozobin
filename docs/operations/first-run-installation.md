# First run

A fresh Dōzobin has no schema, no administrator, and no settings row. Until it has all three, every route redirects to `/install` and the API answers `503`. The health endpoint at `/up` stays open so an orchestrator can still wait on the container.

The wizard has three steps.

**Database.** Reports whether the configured connection answers, which host and schema it is pointed at, and how many migrations are outstanding. It also checks the PHP version, the extensions, the writable directories, and `APP_KEY`. The button runs `migrate --force`.

This step never writes credentials. A container gets its database configuration from the environment it was started with, and a wizard that edited `.env` would be overwritten on the next `docker compose up`. When the connection fails, fix the environment and press *Check again*.

**Administrator.** Creates the first account and signs it in. It is the only unauthenticated write the installer exposes, and it closes permanently the moment an administrator exists. On a public network, complete this step before announcing the address.

**Settings.** Asks for the choices whose default is worth thinking about once — guest sharing, registration mode, default expirations, upload size, quota, the Transfer Session window, malware scanning — and leaves the rest at its defaults. Everything, including the parts the wizard skips, stays editable under Administration. Saving it records `installed_at`, creates the `public/storage` symlink if it is missing, and reopens the application.

## How installed state is recorded

On the `installation_settings` row, not on disk: in a container the database is the volume that survives. An installation that predates the wizard is backfilled by migration, so upgrading never drops an administrator back into the installer.

While the installation is unfinished **and** the database is unreachable, sessions, the cache, and the queue fall back to the filesystem for the duration of the request. Otherwise the wizard could not render the very failure it exists to report.

## Provisioned deployments

Set `DOZOBIN_SKIP_INSTALLER=true` when a deployment creates the administrator and settings itself. The wizard then never appears, and no route is held shut.

`DB_CONNECT_TIMEOUT` (default `5` seconds) bounds how long a MySQL or MariaDB connection attempt may hang, so an unreachable database is reported rather than waited on.
