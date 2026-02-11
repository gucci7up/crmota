<?php
// backend/index.php

// DEBUG PROBE: Uncomment to test if PHP is alive
// header("Content-Type: application/json");
// echo json_encode(["status" => "PHP is running", "env" => getenv('SUPABASE_URL') ? "loaded" : "missing", "ver" => "1.0"]);
// exit;

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Pre-flight check for dependencies
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    http_response_code(500);
    echo json_encode(["error" => "Critical: vendor/autoload.php not found. Run 'composer install'."]);
    exit;
}

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Basic router script
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Expected structure: /api/{module}/{action}
if ($path_parts[0] !== 'api') {
    http_response_code(404);
    echo json_encode(["error" => "Endpoint no encontrado"]);
    exit;
}

$module = $path_parts[1] ?? '';
$action = $path_parts[2] ?? '';

// Validar JWT para todos los módulos excepto webhooks públicos
if ($module !== 'whatsapp' || $_SERVER['REQUEST_METHOD'] !== 'GET') {
    $userData = AuthMiddleware::validateJWT();
    // Set user info for controllers if needed (e.g. for RLS/auditing)
    // $GLOBALS['user'] = $userData;
}

try {
    // Definir controladores y sus archivos
    $routes = [
        'clientes' => 'controllers/ClienteController.php',
        'productos' => 'controllers/ProductoController.php',
        'ventas' => 'controllers/VentaController.php',
        'proveedores' => 'controllers/ProveedorController.php',
        'whatsapp' => 'controllers/WhatsAppController.php',
        'reports' => 'controllers/ReportController.php',
        'upload' => 'controllers/UploadController.php',
        'categorias' => 'controllers/CategoriaController.php'
    ];

    if (isset($routes[$module])) {
        require_once __DIR__ . '/' . $routes[$module];
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Módulo '$module' no encontrado"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error interno del servidor",
        "message" => $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ]);
}
exit;
