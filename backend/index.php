<?php
// backend/index.php

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

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
    // $userData = AuthMiddleware::validateJWT();
}

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
exit;
