<?php
// backend/api/debug_full.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");

$status = [];

// 1. Check Autoload
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    $status['autoload'] = "OK";
} else {
    $status['autoload'] = "MISSING";
    echo json_encode($status);
    exit;
}

// 2. Load Config
try {
    require_once __DIR__ . '/../config/config.php';
    $status['config'] = "LOADED";
} catch (Throwable $e) {
    $status['config'] = "FAILED: " . $e->getMessage();
    echo json_encode($status);
    exit;
}

// 3. Check AuthMiddleware Class
if (class_exists('AuthMiddleware')) {
    $status['AuthMiddleware'] = "EXISTS";
} else {
    // Try explicit require
    if (file_exists(__DIR__ . '/../middleware/AuthMiddleware.php')) {
        require_once __DIR__ . '/../middleware/AuthMiddleware.php';
        $status['AuthMiddleware'] = class_exists('AuthMiddleware') ? "LOADED MANUALLY" : "FAILED TO LOAD";
    } else {
        $status['AuthMiddleware'] = "FILE MISSING";
    }
}

// 4. Check Database Class
if (class_exists('Database')) {
    $status['Database'] = "EXISTS";
} else {
    $status['Database'] = "MISSING";
}

// 5. Check curl extension
if (function_exists('curl_init')) {
    $status['curl'] = "INSTALLED";
} else {
    $status['curl'] = "MISSING";
}

// 6. Test DB Query
try {
    // Need JWT to query? Database::query uses internal keys.
    // Database::query uses self::$authToken which defaults to SUPABASE_KEY (Anon).
    // This should work for public tables or if RLS allows anon.
    // We'll check 'clientes' or just return success if class exists.
    $status['db_test'] = "ATTEMPTING...";

    // Simple non-invasive query
    // Supabase health check or just listing 1 row
    // We can't guarantee 'clientes' implies read access for anon.
    // But we can check if Database::query returns a structure.

    // Let's just create a dummy query that might fail auth but proves connection attempt
    // or just check if we can resolve the constants
    $status['SUPABASE_URL'] = defined('SUPABASE_URL') ? "DEFINED" : "MISSING";
    $status['SUPABASE_JWT_SECRET'] = defined('SUPABASE_JWT_SECRET') ? "DEFINED" : "MISSING";

} catch (Throwable $e) {
    $status['db_test_error'] = $e->getMessage();
}

echo json_encode($status);
