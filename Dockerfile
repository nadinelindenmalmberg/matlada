# Stage 1: Build PHP Dependencies
FROM composer:2 as vendor
WORKDIR /app
COPY database/ database/
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Build Frontend Assets (NEW)
FROM node:20 as frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 3: The final, lean production image
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

# Copy your application code first
COPY . .

# Copy built assets and dependencies from previous stages
COPY --from=vendor /app/vendor/ /app/vendor/
COPY --from=frontend /app/public/build /app/public/build

# Set up production PHP config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Run build-safe optimization commands
RUN php artisan octane:install --server=frankenphp && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache
