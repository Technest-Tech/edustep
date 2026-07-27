FROM composer:2 AS vendor

WORKDIR /app

COPY apps/api/composer.json apps/api/composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --no-scripts

COPY apps/api ./
RUN composer dump-autoload \
    --no-dev \
    --classmap-authoritative \
    --no-interaction

FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        icu-data-full \
        icu-libs \
        libpq \
        libzip \
        postgresql-client \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libzip-dev \
        linux-headers \
        postgresql-dev \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

WORKDIR /var/www/html

COPY apps/api ./
COPY --from=vendor /app/vendor ./vendor
COPY infra/php/production.ini /usr/local/etc/php/conf.d/99-edustep-production.ini
COPY infra/php/opcache.ini /usr/local/etc/php/conf.d/99-edustep-opcache.ini

RUN mkdir -p \
        bootstrap/cache \
        /var/backups/edustep \
        storage/app/private/backups \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
    && chown -R www-data:www-data /var/backups/edustep bootstrap/cache storage

USER www-data

EXPOSE 9000

CMD ["php-fpm", "-F"]
