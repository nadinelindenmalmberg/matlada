# Stage 1: The "builder" stage, using the official Composer image
FROM composer:2 as vendor

WORKDIR /app

# Copy all application files
COPY . .

# Install dependencies and create the optimized autoloader
RUN composer install --no-dev --optimize-autoloader


# Stage 2: The final, lean production image
FROM dunglas/frankenphp

WORKDIR /app

# ✅ FINAL FIX: Install build dependencies, then the PHP extension, then clean up.
RUN apt-get update \
    && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get purge -y --auto-remove libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the installed dependencies from the "vendor" stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Copy your application code
COPY . .

# Set up production PHP config
RUN mv "$PHP_DIR/php.ini-production" "$PHP_DIR/php.ini"

# Run build-safe optimization commands
RUN php artisan octane:install --server=frankenphp && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache
