# Use one deployment-controlled file store

Dōzobin uses one storage backend per installation for every user-generated file, selected through deployment configuration. A local installation keeps its File Store on a persistent volume, while an object-storage installation uses an S3-compatible service. Supported S3 targets include AWS S3, MinIO, and Hetzner Object Storage. The administration UI will not switch backends because doing so would split or strand existing files. The first installable release does not support changing the backend after the installation has accepted uploads.

S3 buckets remain private. After Dōzobin checks the access rules for a File Share or Transfer Item, it redirects the requester to a short-lived signed storage URL instead of proxying the file through PHP. The configured object-storage endpoint therefore has to be reachable from both the application and the requester's browser.

Every object in the File Store remains private, including Member avatars. Dōzobin proxies avatars through a stable application URL with browser cache headers because they are small and an expiring signed URL would be fragile in long-lived pages. The installation never depends on public-bucket policies or per-object ACL support.

Each S3-backed installation uses a dedicated private bucket. Sharing a bucket through per-installation prefixes is outside the initial support contract so permissions, cleanup, backups, and restores retain a clear installation boundary.

Uploads pass through Dōzobin before entering the File Store. This keeps quota checks, file rules, database writes, and optional malware scanning in one request and job flow. Direct and multipart browser uploads to S3 are deferred until their added completion and cleanup protocol solves a demonstrated throughput problem.

The local File Store path is configurable. Standard and DDEV development keep Laravel's `storage/app` layout, while the published container sets the root to `/data/files` and exposes `/data` as its stable volume mount. This container contract keeps persistent files independent of the image's application path and leaves framework caches, logs, and temporary files outside backups. A container using SQLite may keep its database at `/data/database.sqlite`; external database services retain their own volumes.

The installation wizard treats the File Store as a hard requirement. Before installation can finish, Dōzobin writes a random probe object, reads it back, and removes it. File Store operations throw errors so a failed write or deletion cannot masquerade as success.

A File Store outage after installation puts Dōzobin into degraded operation rather than making the whole application unavailable. Uploads and file responses return a controlled service-unavailable result, while Pastes, accounts, administration, and stored metadata remain usable. The liveness endpoint stays healthy to avoid container restart loops; a separate readiness or diagnostic check reports the File Store failure.
