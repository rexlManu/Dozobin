#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY must be set before Dōzobin can start." >&2
    exit 1
fi

mkdir -p \
    /data/files \
    /var/www/html/bootstrap/cache \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs

chown -R www-data:www-data \
    /data \
    /var/www/html/bootstrap/cache \
    /var/www/html/storage

runuser -u www-data -- php artisan config:clear --no-interaction
runuser -u www-data -- php artisan migrate --force --no-interaction
runuser -u www-data -- php artisan optimize --no-interaction

exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
