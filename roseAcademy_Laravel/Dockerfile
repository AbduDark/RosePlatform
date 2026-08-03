FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git unzip icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev \
    ffmpeg \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo_mysql bcmath intl zip gd exif pcntl

# Install getID3 is handled via Composer; install php-cli tools
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# PHP settings for large video uploads (up to 10 GB)
RUN { \
    echo "upload_max_filesize = 10240M"; \
    echo "post_max_size = 10240M"; \
    echo "memory_limit = 2048M"; \
    echo "max_execution_time = 7200"; \
    echo "max_input_time = 7200"; \
    echo "max_file_uploads = 5"; \
} > /usr/local/etc/php/conf.d/uploads.ini

COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-custom.conf

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint
ENTRYPOINT ["docker-entrypoint"]
CMD ["php-fpm"]
