#!/bin/sh
set -e

cd /var/www/html
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

if [ ! -f .env ]; then
    touch .env
fi

if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
    php artisan key:generate --force --no-interaction
fi

if [ "$1" = "php-fpm" ]; then
    php artisan migrate --force --no-interaction
    php artisan storage:link >/dev/null 2>&1 || true
    php artisan optimize:clear
fi

exec "$@"
