<?php
// backend/config/config.php

require_once __DIR__ . '/../vendor/autoload.php';

// Function to safely get env vars
function getEnvVar($key, $default = '')
{
    $val = getenv($key);
    if ($val !== false)
        return $val;
    if (isset($_ENV[$key]))
        return $_ENV[$key];
    if (isset($_SERVER[$key]))
        return $_SERVER[$key];
    return $default;
}

// Load env if .env exists (dev mode)
// $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
// try {
//     $dotenv->safeLoad();
// } catch (Exception $e) {
//     // Ignore if .env missing
// }

define('SUPABASE_URL', getEnvVar('SUPABASE_URL'));
define('SUPABASE_KEY', getEnvVar('SUPABASE_ANON_KEY'));
define('SUPABASE_SERVICE_ROLE_KEY', getEnvVar('SUPABASE_SERVICE_ROLE_KEY'));
define('WHATSAPP_TOKEN', getEnvVar('WHATSAPP_TOKEN'));
define('WHATSAPP_PHONE_ID', getEnvVar('WHATSAPP_PHONE_ID'));
define('SUPABASE_JWT_SECRET', getEnvVar('SUPABASE_JWT_SECRET', 'pYn1H3qxtu7PRf7QdcMEi+wRR/FBiYN1Ho8zSQ9wxhahcx4riOdNUCjHzzzkKNyQJDo4EV9G+ORFxxvNK1p2TA=='));

require_once __DIR__ . '/Database.php';

// Note: CORS headers are handled in index.php to ensure they run for all requests

