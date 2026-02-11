FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libcurl4-openssl-dev \
    libxml2-dev \
    libonig-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql curl mbstring xml zip

RUN a2enmod rewrite

# Enable .htaccess and Display Errors
RUN echo '<Directory /var/www/html>' >> /etc/apache2/apache2.conf && \
    echo '    AllowOverride All' >> /etc/apache2/apache2.conf && \
    echo '</Directory>' >> /etc/apache2/apache2.conf && \
    echo 'display_errors = On' >> /usr/local/etc/php/conf.d/docker-php-ext-display_errors.ini && \
    echo 'display_startup_errors = On' >> /usr/local/etc/php/conf.d/docker-php-ext-display_errors.ini

COPY . /var/www/html/
WORKDIR /var/www/html/

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
