# Release checklist

Code can cover safe defaults, but it can't choose your domain, backup storage, or abuse policy. Finish these items on the real production host before publishing its URL.

## Host and application

- [ ] Point the web root at `public/` and reject direct access to dotfiles.
- [ ] Install PHP 8.5 or newer, the required extensions, Composer 2, Node.js 24, and pnpm 10.
- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY`, and the final HTTPS `APP_URL`.
- [ ] Terminate TLS at the web server or reverse proxy, redirect HTTP to HTTPS, and set `SESSION_SECURE_COOKIE=true`.
- [ ] If a reverse proxy forwards requests, set `TRUSTED_PROXIES` to its IP ranges. Don't use `*` on a host that clients can reach directly.
- [ ] Give the PHP process write access only where Laravel needs it: `storage/`, `bootstrap/cache/`, and the local File Store path when used.

## Data and background work

- [ ] Use a persistent production database and run `php artisan migrate --force` during deployments.
- [ ] Keep uploaded payloads on persistent storage. Confirm that `/data` is mounted or that the private S3-compatible bucket survives container replacement.
- [ ] Check `/ready` and verify that both the database and File Store report ready.
- [ ] Supervise the default queue worker, the `scans` worker, and the scheduler. Alert when any of them stops or builds a backlog.
- [ ] Back up the database and payload storage, encrypt off-host copies, and test one full restore before launch.
- [ ] Choose log retention and send production exceptions somewhere an operator will see them.

## Mail, uploads, and abuse

- [ ] Configure a real `MAIL_MAILER` and verify password-reset delivery from the production domain.
- [ ] Review Guest sharing, registration mode, quotas, upload limits, allowed file types, expiration windows, and payload cleanup in Administration.
- [ ] If malware scanning is enabled, keep ClamAV on a Unix socket or private network. Match `StreamMaxLength` to the largest allowed upload.
- [ ] Put an upstream request-size limit slightly above the application's maximum upload size and set matching PHP upload limits.
- [ ] Decide how users can report abusive or illegal Share URLs. Publish that contact route where your audience can find it.

## Search and public repository

- [ ] Decide whether this installation belongs in search. Set `SEO_INDEX=false` if it doesn't.
- [ ] Set a production `SEO_DESCRIPTION` and host a 1200 by 630 social image for `SEO_IMAGE_URL`.
- [ ] Check `/robots.txt`, `/sitemap.xml`, canonical URLs, and social metadata on the final domain.
- [ ] Submit the sitemap to Google Search Console and Bing Webmaster Tools if indexing is enabled.
- [ ] Set the GitHub description, topics, and project URL, then enable private vulnerability reporting and branch protection.
- [ ] Before the first tag, make the repository public so installations can read GitHub Releases without credentials.
- [ ] After the first image is published, make the `dozobin` GHCR package public and verify an anonymous pull from a logged-out Docker client.

## Release proof

- [ ] Run `composer ci:check` from a clean checkout.
- [ ] Run `composer audit` and `pnpm audit` against the locked dependencies; review the result instead of applying blind upgrades.
- [ ] Test installation, sign-in, password reset, File Share upload and download, Paste creation, Transfer Sessions, expiration cleanup, and one backup restore on a staging host.
- [ ] Tag the release only after CI passes on the exact commit.
