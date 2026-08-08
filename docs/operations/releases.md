# Publishing releases

The release workflow stays idle until a tag matching `v*.*.*` is pushed. It accepts stable tags such as `v1.2.3`, builds one image for `linux/amd64` and `linux/arm64`, publishes it to GHCR, records provenance, and creates the matching GitHub Release with generated notes.

## First public release

1. Make `rexlManu/Dozobin` public. The in-app update checker uses GitHub's public latest-release endpoint and intentionally has no token support.
2. Run the release checklist and tag the exact checked commit with a stable semantic version such as `v1.0.0`.
3. Push the tag. The workflow publishes `1.0.0`, `1.0`, `1`, and `latest`, then creates the GitHub Release.
4. In the GitHub package settings for `dozobin`, change the package visibility to public. GHCR packages are not made public by the workflow.
5. From a Docker client that is not logged in to GHCR, pull `ghcr.io/rexlmanu/dozobin:1.0.0` and start a staging installation.

The workflow authenticates its own push with the repository's `GITHUB_TOKEN`; no registry secret is required. Consumers need authentication only while the package is private. Once its visibility is public, anonymous pulls work.

## Later releases

Create each release from a new stable tag. Version tags are immutable; never repoint `1.0.0`. The workflow advances the matching major, minor, and `latest` aliases. If the workflow fails before creating the GitHub Release, fix the failure and rerun the job rather than creating a release that has no matching image.

The app compares only stable semantic versions. Drafts, prereleases, and development builds never produce an administrator update notice.
