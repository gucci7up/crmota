FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libcurl4-openssl-dev \
    libxml2-dev \
    libonig-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql curl mbstring xml


RUN a2enmod rewrite

# Allow .htaccess to override config
RUN sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

COPY . /var/www/html/
WORKDIR /var/www/html/

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
