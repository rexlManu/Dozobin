# syntax=docker/dockerfile:1.7

FROM php:8.5-fpm-bookworm AS php-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libpq-dev \
        libsqlite3-dev \
        libxml2-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        intl \
        mbstring \
        pcntl \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        xml \
        zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

FROM php-base AS vendor

WORKDIR /var/www/html
COPY . .
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --classmap-authoritative

FROM node:24-bookworm-slim AS node-runtime

FROM php-base AS frontend

COPY --from=node-runtime /usr/local /usr/local
COPY --from=node-runtime /opt /opt

WORKDIR /app
COPY . .
COPY --from=vendor /var/www/html/vendor /app/vendor
RUN corepack enable \
    && corepack prepare pnpm@10.33.2 --activate \
    && pnpm install --frozen-lockfile \
    && pnpm run build

FROM php-base AS runtime

ARG APP_VERSION=dev
ARG APP_COMMIT
ARG APP_BUILT_AT

LABEL org.opencontainers.image.title="Dōzobin" \
      org.opencontainers.image.description="Self-hosted file and text sharing" \
      org.opencontainers.image.source="https://github.com/rexlManu/Dozobin" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${APP_COMMIT}" \
      org.opencontainers.image.created="${APP_BUILT_AT}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        nginx \
        supervisor \
        util-linux \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /var/www/html
COPY --from=vendor /var/www/html /var/www/html
COPY --from=frontend /app/public/build /var/www/html/public/build
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/dozobin.ini
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/dozobin-entrypoint

ENV APP_VERSION=${APP_VERSION} \
    APP_COMMIT=${APP_COMMIT} \
    APP_BUILT_AT=${APP_BUILT_AT} \
    FILE_STORE_PATH=/data/files

RUN php docker/write-build-metadata.php \
    && chmod +x /usr/local/bin/dozobin-entrypoint \
    && mkdir -p /data/files storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data /data storage bootstrap/cache

EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent --show-error \
        --header "Host: $(php -r 'echo parse_url((string) getenv("APP_URL"), PHP_URL_HOST);')" \
        http://127.0.0.1:8080/up || exit 1

ENTRYPOINT ["dozobin-entrypoint"]
