# Use the official FrankenPHP image as a base
FROM dunglas/frankenphp

# Enable PHP production settings
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Set the working directory
WORKDIR /app

# Copy the entire Laravel project into the container
COPY . /app

# Install Composer dependencies and configure Octane
RUN composer install --no-dev --optimize-autoloader
RUN php artisan octane:install --server=frankenphp
