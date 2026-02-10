<?php
// backend/config/config.php

require_once __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno (simulado o via .env)
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

define('SUPABASE_URL', $_ENV['SUPABASE_URL'] ?? '');
define('SUPABASE_KEY', $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? ''); // Usar service role para operaciones administrativas si es necesario
define('WHATSAPP_TOKEN', $_ENV['WHATSAPP_TOKEN'] ?? '');
define('WHATSAPP_PHONE_ID', $_ENV['WHATSAPP_PHONE_ID'] ?? '');

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}
