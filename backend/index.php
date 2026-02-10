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

// Validar JWT para todos los endpoints excepto webhooks de WhatsApp si fuera necesario
// $userData = AuthMiddleware::validateJWT();

switch ($module) {
    case 'clientes':
        require_once __DIR__ . '/controllers/ClienteController.php';
        // Handle client logic
        break;

    case 'whatsapp':
        require_once __DIR__ . '/controllers/WhatsAppController.php';
        // Handle whatsapp callbacks
        break;

    case 'reports':
        require_once __DIR__ . '/controllers/ReportController.php';
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Módulo no encontrado"]);
        break;
}
