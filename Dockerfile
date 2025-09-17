# Stage 1: The "builder" stage, using the official Composer image
FROM composer:2 as vendor

WORKDIR /app

# Copy all application files
COPY . .

# This single command handles installation and autoloader optimization.
# We no longer need --no-scripts because the artisan file is present.
RUN composer install --no-dev --optimize-autoloader


# Stage 2: The final, lean production image
FROM dunglas/frankenphp

WORKDIR /app

# Copy the installed dependencies from the "vendor" stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Copy your application code
# Note: This overwrites the code from the vendor stage, which is fine.
# We only needed it there for the composer install process.
COPY . .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# This command now ONLY runs php artisan commands, as Composer isn't here.
# These commands prepare your application for production.
RUN php artisan octane:install --server=frankenphp && \
    php artisan optimize:clear && \
    php artisan optimize
