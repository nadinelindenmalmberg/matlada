# Stage 1: The "builder" stage, with Composer
FROM composer:2 as vendor

WORKDIR /app

# Copy only dependency files first to leverage Docker cache
COPY database/ database/
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader


# Stage 2: The final production image
FROM dunglas/frankenphp

WORKDIR /app

# Copy the installed dependencies from the "vendor" stage
COPY --from=vendor /app/vendor/ /app/vendor/

# Copy the rest of your application code
COPY . .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Install Octane (if not already in composer.json) and generate optimized files
RUN php artisan octane:install --server=frankenphp
