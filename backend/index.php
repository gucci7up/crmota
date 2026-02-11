<?php
// backend/index.php

// DEBUG PROBE: Uncomment to test if PHP is alive
// header("Content-Type: application/json");
// echo json_encode(["status" => "PHP is running", "env" => getenv('SUPABASE_URL') ? "loaded" : "missing", "ver" => "1.0"]);
// exit;

// Enable error reporting but incorrectly configured to display HTML in production
// We need to force JSON output for all errors
ini_set('display_errors', 0); // Hide HTML errors
ini_set('log_errors', 1);     // Log to file/stderr
error_reporting(E_ALL);

// Custom Error Handler to return JSON
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    http_response_code(500);
    echo json_encode([
        "error" => "PHP Error",
        "message" => $errstr,
        "file" => basename($errfile),
        "line" => $errline
    ]);
    exit;
});

// Custom Exception Handler for uncaught exceptions
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Uncaught Exception",
        "message" => $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
    exit;
});

// Register shutdown function to catch Fatal Errors (like parse errors, OOM)
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        // Clear any previous output (like HTML partials)
        if (ob_get_length())
            ob_clean();

        http_response_code(500);
        header("Content-Type: application/json");
        echo json_encode([
            "error" => "Fatal Error",
            "message" => $error['message'],
            "file" => basename($error['file']),
            "line" => $error['line']
        ]);
        exit;
    }
});

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

// BYPASS: Direct File Serving for process_payment.php
// This handles cases where rewrite rules force everything to index.php
$direct_files = ['process_payment.php', 'verify_payment_endpoint.php', 'debug_env.php'];
if (isset($path_parts[1]) && in_array($path_parts[1], $direct_files)) {
    $file_path = __DIR__ . '/api/' . $path_parts[1];
    if (file_exists($file_path)) {
        require_once $file_path;
        exit;
    }
}

// BYPASS: Direct Action Handling via Query Params
// This works even if Nginx rewrites are broken or PATH_INFO is missing
$action_param = $_GET['action'] ?? '';

if ($action_param === 'process_payment' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Enable CORS for this specific block just in case
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");

    // Config & Auth
    if (file_exists(__DIR__ . '/config/config.php'))
        require_once __DIR__ . '/config/config.php';
    require_once __DIR__ . '/middleware/AuthMiddleware.php';

    try {
        $user = AuthMiddleware::validateJWT(); // Validate User

        // Validation
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input)
            throw new Exception("Invalid JSON Input");

        $cliente_id = $input['cliente_id'] ?? null;
        $monto_abono = floatval($input['monto'] ?? 0);
        $metodo_pago = $input['metodo_pago'] ?? 'efectivo';
        $referencia = $input['referencia'] ?? '';

        if (!$cliente_id || $monto_abono <= 0)
            throw new Exception("Datos inválidos");

        // Logic (Inline to verify it works)
        // 1. Get Sales
        $ventasResponse = Database::query('ventas', [
            'select' => 'id',
            'cliente_id' => 'eq.' . $cliente_id,
            'metodo_pago' => 'eq.cuotas'
        ]);

        if ($ventasResponse['status'] >= 400)
            throw new Exception("Error BD Ventas");

        $ventas = $ventasResponse['data'];
        if (empty($ventas)) {
            echo json_encode(["message" => "Sin deuda", "monto_abonado" => 0, "detalle" => []]);
            exit;
        }

        $ventaIds = array_column($ventas, 'id');
        $ventaIdsString = '(' . implode(',', $ventaIds) . ')';

        // 2. Get Cuotas
        $cuotasResponse = Database::query('cuotas', [
            'select' => 'id, monto, monto_pagado, fecha_vencimiento, estado, venta_id',
            'venta_id' => 'in.' . $ventaIdsString,
            'estado' => 'neq.pagado',
            'order' => 'fecha_vencimiento.asc'
        ]);

        if ($cuotasResponse['status'] >= 400)
            throw new Exception("Error BD Cuotas");
        $allCuotas = $cuotasResponse['data'];

        // 3. Process
        $remanente = $monto_abono;
        $pagosRealizados = [];

        foreach ($allCuotas as $cuota) {
            if ($remanente <= 0.01)
                break;

            $deuda = floatval($cuota['monto']) - floatval($cuota['monto_pagado'] ?? 0);
            $pago = min($remanente, $deuda);

            $nuevo_pagado = floatval($cuota['monto_pagado'] ?? 0) + $pago;
            $nuevo_estado = ($nuevo_pagado >= (floatval($cuota['monto']) - 0.01)) ? 'pagado' : 'pendiente';

            Database::update('cuotas', ['monto_pagado' => $nuevo_pagado, 'estado' => $nuevo_estado], ['id' => 'eq.' . $cuota['id']]);

            Database::insert('historial_pagos', [
                'venta_id' => $cuota['venta_id'],
                'cuota_id' => $cuota['id'],
                'cliente_id' => $cliente_id,
                'usuario_id' => $user['sub'] ?? null,
                'monto' => $pago,
                'metodo_pago' => $metodo_pago,
                'referencia' => $referencia . ' (Failsafe)'
            ]);

            $pagosRealizados[] = ['id' => $cuota['id'], 'pagado' => $pago];
            $remanente -= $pago;
        }

        echo json_encode([
            "success" => true,
            "message" => "Pago procesado via Failsafe",
            "abonado" => $monto_abono - $remanente
        ]);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
        exit;
    }
}

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
        'categorias' => 'controllers/CategoriaController.php',
        'pagos' => 'controllers/PagosController.php'

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
