# Publish on GHCR and discover GitHub releases

Dōzobin publishes its public container image to GitHub Container Registry and treats stable GitHub Releases as the source of truth for available application versions. A release workflow builds the image and creates both artifacts from the same Git tag; public GHCR visibility allows anonymous pulls, while Dōzobin checks GitHub's public latest-release endpoint without bundling the `gh` CLI or requiring an installation token. Docker Hub is not part of the initial release path because keeping images, source tags, release notes, and automation on GitHub removes a second version authority.

The running application only reports that an update exists and links administrators to its release information. Pulling an image, applying the update, and restarting services remain the responsibility of Coolify, Docker Compose, or another deployment system. Dōzobin never requires access to the Docker socket or registry credentials.

Tagged image builds embed the semantic application version, source commit SHA, and build timestamp in application-readable metadata and matching OCI labels. The running application reads this immutable metadata without inspecting the Docker daemon or trusting an operator-supplied version value; non-release development builds identify themselves as `dev`.

Installed applications check GitHub's public latest-release endpoint at most once every 24 hours and cache the result. Checks are enabled by default, send no installation identifier or telemetry, and can be disabled through deployment configuration for offline or privacy-sensitive installations. A failed or rate-limited request does not affect application health and remains silent until a later retry.

Only administrators see Update Notices. The administration interface shows the installed and latest versions and links to the matching GitHub Release and update instructions; public pages and Member screens never show deployment messages.

Each administrator may dismiss the notice for one specific release. That dismissal does not hide the update from other administrators, a newer release appears again automatically, and the administration system page continues to show version status even when its notice has been dismissed.

The initial release process has one stable semantic-version channel. A `v1.4.2` source tag and GitHub Release publish an immutable `1.4.2` image plus moving `1.4`, `1`, and `latest` tags. Drafts and prereleases neither replace the stable tags nor trigger Update Notices; preview and nightly channels are deferred until the project has a concrete testing audience for them.

Production containers apply pending database migrations before serving traffic. A failed migration fails container startup, and the deployment cannot report healthy until the schema matches the running image. Release instructions tell operators to back up persistent data before pulling and redeploying a newer version.

Every stable image tag is a multi-architecture manifest supporting `linux/amd64` and `linux/arm64`. Both architectures carry identical application metadata and participate in the same release channel.
