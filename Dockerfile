# Stage 1: Unified Builder
# The official composer image includes PHP. We will add Node.js.
FROM composer:2 as builder
WORKDIR /app

# ✅ FIX: Install Node.js and npm into the builder container
RUN apt-get update && apt-get install -y ca-certificates curl gnupg \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && NODE_MAJOR=20 \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install nodejs -y

# Copy all source files
COPY . .

# Install all dependencies (PHP & Node)
RUN composer install --no-dev --optimize-autoloader
RUN npm install

# Build frontend assets (this will now work)
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
COPY --from=builder /app .

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Run build-safe optimization commands
RUN php artisan octane:install --server=frankenphp && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache
