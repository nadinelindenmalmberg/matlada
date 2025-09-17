# Stage 1: Unified Builder
# The official composer image includes PHP, Node.js, and npm.
FROM composer:2 as builder
WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies (PHP & Node)
RUN composer install --no-dev --optimize-autoloader
RUN npm install

# Build frontend assets (this will now work as PHP is available)
RUN npm run build

# Stage 2: The final, lean production image
FROM dunglas/frankenphp
WORKDIR /app

# Install PHP extensions and system dependencies
RUN apt-get update \
    && apt-get install -y \
        libpq-dev \
        libpq5 \
    && docker-php-ext-install \
        pdo pdo_pgsql \
        pcntl \
    && apt-get purge -y --auto-remove libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire built application from the builder stage
# This includes source code, vendor dir, and the public/build dir
COPY --from=builder /app .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Run build-safe optimization commands
RUN php artisan octane:install --server=frankenphp && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache
