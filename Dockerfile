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

# ✅ ADDED: Install the PostgreSQL PHP driver
# This ensures your app can connect to the DB when it's running
RUN docker-php-ext-install pdo pdo_pgsql

# Copy the installed dependencies from the "vendor" stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Copy your application code
COPY . .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# ✅ CHANGED: Run build-safe optimization commands
# These cache config and routes to files without needing a database
RUN php artisan octane:install --server=frankenphp && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache
