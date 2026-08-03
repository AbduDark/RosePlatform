#!/bin/sh
set -e

cd /var/www/html

# Ensure required framework directories exist with proper ownership and permissions
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
    echo "Running clean composer install inside container..."
    composer install --no-interaction --prefer-dist --optimize-autoloader

    echo "Clearing cached package and service files..."
    rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php bootstrap/cache/routes-*.php

    php artisan migrate --force --no-interaction
    php artisan storage:link >/dev/null 2>&1 || true
    php artisan optimize:clear

    # ─── تشغيل Laravel Scheduler في الخلفية داخل الكونتينر ─────────────────
    # يُشغّل schedule:run كل 60 ثانية بدلاً من الاعتماد على Cron خارجي
    echo "Starting Laravel Scheduler in background..."
    (
        while true; do
            php artisan schedule:run --no-interaction >> storage/logs/scheduler.log 2>&1
            sleep 60
        done
    ) &
    echo "Laravel Scheduler started (PID: $!)"
fi

exec "$@"
