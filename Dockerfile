# Stage 1: The "builder" stage, with Composer
FROM composer:2 as vendor

WORKDIR /app

# ✅ CHANGE: Copy ALL application files first.
# This ensures 'artisan' is available for composer scripts.
COPY . .

# Now, install dependencies.
RUN composer install --no-scripts --no-dev --optimize-autoloader


# Stage 2: The final production image
FROM dunglas/frankenphp

WORKDIR /app

# Copy the installed dependencies from the "vendor" stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Copy the rest of your application code
COPY . .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Finish composer setup and run optimizations
RUN composer dump-autoload --optimize && \
    php artisan octane:install --server=frankenphp && \
    php artisan optimize:clear && \
    php artisan optimize
