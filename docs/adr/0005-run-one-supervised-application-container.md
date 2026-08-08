# Run one supervised application container

The initial supported Docker topology runs the web process, default queue worker, malware-scan queue worker, and scheduler under supervision in one Dōzobin container. A database remains a separate service, and ClamAV is an optional separate service; this shape gives Docker Compose and Coolify installations one application service, one health boundary, and one shared local File Store mount. Separate application process containers and horizontal scaling are outside the first release contract and can be introduced when an installation needs them.
