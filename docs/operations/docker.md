# Docker deployment

The official image is designed for a single app container behind a TLS-terminating reverse proxy. That container supervises Nginx, PHP-FPM, the default and malware-scan queue workers, and the Laravel scheduler. MariaDB and optional ClamAV remain separate services.

The repository and GHCR package remain private during development. The commands below become usable without registry authentication after the first image has been published and the GHCR package visibility has been changed to public.

## Start an installation

Copy `compose.production.yaml` to the host. Generate an application key with `printf 'base64:%s\n' "$(openssl rand -base64 32)"`, then create a `.env` beside the Compose file:

```dotenv
APP_KEY=base64:replace-with-the-generated-value
APP_URL=https://files.example.com
DB_PASSWORD=replace-with-a-long-random-password
DB_ROOT_PASSWORD=replace-with-another-long-random-password
DOZOBIN_VERSION=latest
```

Then start the services:

```sh
docker compose -f compose.production.yaml up -d
```

The app listens on port `8080` by default. Put it behind HTTPS and forward the original scheme. The container runs `php artisan migrate --force` before starting its supervised processes. `/up` is the web-process liveness endpoint; `/ready` also checks the database and File Store.

The default File Store is `/data/files` on the `app-data` volume. All user-generated files, including avatars, Shares, and Transfer Session items, use this store. Back up both `app-data` and `database-data` and test a restore.

## Use S3-compatible storage

Create a dedicated private bucket for each Dōzobin installation. The installer verifies write, read, and delete access before it can finish. Add these values to the Compose `.env`:

```dotenv
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=replace-me
AWS_SECRET_ACCESS_KEY=replace-me
AWS_DEFAULT_REGION=replace-me
AWS_BUCKET=dozobin
AWS_ENDPOINT=https://replace-me
AWS_USE_PATH_STYLE_ENDPOINT=false
```

For AWS S3, leave `AWS_ENDPOINT` empty. For Hetzner Object Storage, use the bucket location as the region and `https://<location>.your-objectstorage.com` as the endpoint. Keep path-style endpoints disabled.

For MinIO, use its S3 API endpoint and enable path-style addressing:

```dotenv
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT=https://s3.example.com
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Authenticated downloads receive a short-lived signed URL. The configured endpoint must therefore be an HTTPS address that both the app container and the user's browser can resolve. Do not configure an internal-only hostname such as `http://minio:9000` unless clients can also reach it. The bucket itself stays private. Avatars are always streamed through Dōzobin and are never exposed by a public object URL.

Once S3 is working and `/ready` reports success, the `app-data` volume contains only application runtime data; user uploads live in the bucket. There is no built-in migration command between local and S3 stores, so choose the production backend before accepting uploads.

## Upgrade

Back up the database and File Store, then pull and recreate the app:

```sh
docker compose -f compose.production.yaml pull app
docker compose -f compose.production.yaml up -d app
```

`latest` follows the newest stable release. Set `DOZOBIN_VERSION` to an immutable version such as `1.2.3` when you want controlled upgrades. Major (`1`) and minor (`1.2`) moving tags are also published.

Stable images embed the release version, commit, and build time. Dōzobin checks the latest public GitHub Release once per day and shows an update notice only to administrators. Dismissing it hides that release for that administrator. Set `DOZOBIN_UPDATE_CHECK=false` to disable outbound update checks. Development builds identify as `dev` and never make the request.

## Optional malware scanning

Do not install ClamAV in the app container. Run it as a separate service on a private network and set `CLAMAV_HOST` and `CLAMAV_PORT` on the app. See [maintenance and malware scanning](maintenance-and-malware-scanning.md) for timeouts and size limits.
